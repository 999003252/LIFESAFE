import hashlib

import boto3
from fastapi import APIRouter, HTTPException

from database import FRIENDSHIPS_TABLE, MESSAGES_TABLE
from routers.users import normalize_user_id

router = APIRouter(prefix="/messages", tags=["messages"])


def conversation_id(user_id: str, friend_id: str) -> str:
    participants = ":".join(sorted([user_id, friend_id]))
    return hashlib.sha256(participants.encode("utf-8")).hexdigest()


def are_friends(user_id: str, friend_id: str) -> bool:
    response = FRIENDSHIPS_TABLE.get_item(
        Key={"userId": user_id, "friendId": friend_id}
    )
    return "Item" in response


@router.get("")
def list_messages(userId: str, friendId: str):
    user_id = normalize_user_id(userId)
    friend_id = normalize_user_id(friendId)

    if not are_friends(user_id, friend_id):
        raise HTTPException(status_code=403, detail="You can only message friends.")

    try:
        response = MESSAGES_TABLE.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("conversationId").eq(
                conversation_id(user_id, friend_id)
            ),
            ScanIndexForward=True,
            Limit=100,
        )
        return response.get("Items", [])
    except Exception as error:
        raise HTTPException(status_code=500, detail="Could not load messages.") from error
