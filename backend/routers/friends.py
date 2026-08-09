import hashlib
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai_support import AI_SUPPORT_ID, ai_support_contact
from database import FRIENDSHIPS_TABLE, MESSAGES_TABLE, dynamodb
from routers.users import get_profile, normalize_user_id, profile_response

router = APIRouter(prefix="/friends", tags=["friends"])


class FriendIn(BaseModel):
    userId: str
    friendId: str


class FriendReadIn(FriendIn):
    pass


def friendship_exists(user_id: str, friend_id: str) -> bool:
    response = FRIENDSHIPS_TABLE.get_item(
        Key={"userId": user_id, "friendId": friend_id}
    )
    return "Item" in response


@router.get("")
def list_friends(userId: str):
    user_id = normalize_user_id(userId)
    try:
        ai_messages = MESSAGES_TABLE.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("conversationId").eq(
                hashlib.sha256(
                    ":".join(sorted([user_id, AI_SUPPORT_ID])).encode("utf-8")
                ).hexdigest()
            ),
            ScanIndexForward=False,
            Limit=1,
        )
        support = ai_support_contact(
            (ai_messages.get("Items") or [None])[0]
        )
        response = FRIENDSHIPS_TABLE.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id)
        )
        friendships = response.get("Items", [])
        friend_ids = [friendship["friendId"] for friendship in friendships]
        if not friend_ids:
            return [support]

        friendship_by_id = {friendship["friendId"]: friendship for friendship in friendships}

        friends = []
        for friend_id in friend_ids:
            profile = get_profile(friend_id)
            if profile:
                friends.append(
                    {
                        **profile_response(profile),
                        "lastMessagePreview": friendship_by_id[friend_id].get(
                            "lastMessagePreview", "No messages yet"
                        ),
                        "lastMessageAt": friendship_by_id[friend_id].get("lastMessageAt"),
                        "unreadCount": friendship_by_id[friend_id].get("unreadCount", 0),
                        "latestCheckIn": friendship_by_id[friend_id].get("latestCheckIn"),
                        "checkInUnread": friendship_by_id[friend_id].get("checkInUnread", False),
                    }
                )
        return [support, *friends]
    except Exception as error:
        raise HTTPException(status_code=500, detail="Could not load friends.") from error


@router.post("")
def add_friend(friendship: FriendIn):
    user_id = normalize_user_id(friendship.userId)
    friend_id = normalize_user_id(friendship.friendId)

    if user_id == friend_id:
        raise HTTPException(status_code=400, detail="You cannot add yourself.")
    if not get_profile(user_id) or not get_profile(friend_id):
        raise HTTPException(status_code=404, detail="That account could not be found.")
    if friendship_exists(user_id, friend_id):
        raise HTTPException(status_code=409, detail="This person is already in your friends list.")

    created_at = datetime.now(timezone.utc).isoformat()
    item = {
        "createdAt": created_at,
        "lastMessagePreview": "No messages yet",
        "lastReadAt": created_at,
        "unreadCount": 0,
    }

    try:
        dynamodb.meta.client.transact_write_items(
            TransactItems=[
                {
                    "Put": {
                        "TableName": FRIENDSHIPS_TABLE.name,
                        "Item": {
                            "userId": user_id,
                            "friendId": friend_id,
                            **item,
                        },
                        "ConditionExpression": "attribute_not_exists(userId) AND attribute_not_exists(friendId)",
                    }
                },
                {
                    "Put": {
                        "TableName": FRIENDSHIPS_TABLE.name,
                        "Item": {
                            "userId": friend_id,
                            "friendId": user_id,
                            **item,
                        },
                        "ConditionExpression": "attribute_not_exists(userId) AND attribute_not_exists(friendId)",
                    }
                },
            ]
        )
    except dynamodb.meta.client.exceptions.TransactionCanceledException as error:
        raise HTTPException(
            status_code=409, detail="This person is already in your friends list."
        ) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Could not add friend.") from error

    return profile_response(get_profile(friend_id))


@router.post("/read")
def mark_friend_read(friendship: FriendReadIn):
    user_id = normalize_user_id(friendship.userId)
    friend_id = normalize_user_id(friendship.friendId)

    if friend_id == AI_SUPPORT_ID:
        return {"status": "read"}

    if not friendship_exists(user_id, friend_id):
        raise HTTPException(status_code=404, detail="That friend connection could not be found.")

    FRIENDSHIPS_TABLE.update_item(
        Key={"userId": user_id, "friendId": friend_id},
        UpdateExpression=(
            "SET unreadCount = :zero, lastReadAt = :readAt, "
            "checkInUnread = :checkInRead"
        ),
        ExpressionAttributeValues={
            ":zero": 0,
            ":readAt": datetime.now(timezone.utc).isoformat(),
            ":checkInRead": False,
        },
    )
    return {"status": "read"}
