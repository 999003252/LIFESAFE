import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import FRIENDSHIPS_TABLE, get_table
from routers.users import normalize_user_id

router = APIRouter(prefix="/entries", tags=["entries"])
table = get_table("DYNAMODB_TABLE_NAME", "JournalEntries")
logger = logging.getLogger("uvicorn.error")


class JournalEntryIn(BaseModel):
    userId: str
    mood: str
    moodLabel: str
    moodIcon: str
    answers: List[str]
    shareWithFriends: bool = False
    shareMessage: str = Field(default="", max_length=160)
    wantsCheckIn: bool = False


class JournalEntryOut(JournalEntryIn):
    entryId: str
    timestamp: str


class CheckInStatus(BaseModel):
    completed: bool


def _shared_check_in(entry: JournalEntryIn, entry_id: str, timestamp: str):
    return {
        "entryId": entry_id,
        "mood": entry.mood,
        "moodLabel": entry.moodLabel,
        "moodIcon": entry.moodIcon,
        "message": entry.shareMessage.strip(),
        "wantsCheckIn": entry.wantsCheckIn,
        "createdAt": timestamp,
    }


def _friend_ids(user_id: str):
    response = FRIENDSHIPS_TABLE.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
        ProjectionExpression="friendId",
    )
    return [item["friendId"] for item in response.get("Items", [])]


def publish_shared_check_in(entry: JournalEntryIn, entry_id: str, timestamp: str):
    """Fan out a privacy-safe check-in snapshot to the user's friends."""
    user_id = normalize_user_id(entry.userId)
    check_in = _shared_check_in(entry, entry_id, timestamp)

    for friend_id in _friend_ids(user_id):
        FRIENDSHIPS_TABLE.update_item(
            Key={"userId": friend_id, "friendId": user_id},
            UpdateExpression="SET latestCheckIn = :checkIn, checkInUnread = :unread",
            ExpressionAttributeValues={
                ":checkIn": check_in,
                ":unread": True,
            },
        )


def remove_shared_check_in(user_id: str, entry_id: str):
    """Remove this entry's snapshot without deleting a newer shared check-in."""
    normalized_user_id = normalize_user_id(user_id)
    for friend_id in _friend_ids(normalized_user_id):
        try:
            FRIENDSHIPS_TABLE.update_item(
                Key={"userId": friend_id, "friendId": normalized_user_id},
                UpdateExpression="SET checkInUnread = :unread REMOVE latestCheckIn",
                ConditionExpression="latestCheckIn.entryId = :entryId",
                ExpressionAttributeValues={
                    ":entryId": entry_id,
                    ":unread": False,
                },
            )
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
                raise


@router.post("", response_model=JournalEntryOut)
def create_entry(entry: JournalEntryIn):
    entry_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()

    item = {
        "userId": entry.userId,
        "timestamp": timestamp,
        "entryId": entry_id,
        "mood": entry.mood,
        "moodLabel": entry.moodLabel,
        "moodIcon": entry.moodIcon,
        "answers": entry.answers,
        "shareWithFriends": entry.shareWithFriends,
        "shareMessage": entry.shareMessage.strip(),
        "wantsCheckIn": entry.wantsCheckIn if entry.shareWithFriends else False,
    }

    try:
        table.put_item(Item=item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save entry: {e}")

    if entry.shareWithFriends:
        try:
            publish_shared_check_in(entry, entry_id, timestamp)
        except Exception:
            logger.exception("Journal entry saved, but its social check-in could not be shared.")

    return item


@router.get("", response_model=List[JournalEntryOut])
def list_entries(userId: str):
    try:
        response = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(userId),
            ScanIndexForward=False,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch entries: {e}")

    return response.get("Items", [])


@router.get("/today", response_model=CheckInStatus)
def get_today_checkin(userId: str, start: datetime, end: datetime):
    if start.tzinfo is None or end.tzinfo is None or start >= end:
        raise HTTPException(status_code=400, detail="Invalid local day range")

    start_utc = start.astimezone(timezone.utc).isoformat()
    end_utc = (
        end.astimezone(timezone.utc) - timedelta(microseconds=1)
    ).isoformat()

    try:
        response = table.query(
            KeyConditionExpression=(
                boto3.dynamodb.conditions.Key("userId").eq(userId)
                & boto3.dynamodb.conditions.Key("timestamp").between(
                    start_utc, end_utc
                )
            ),
            Limit=1,
            ProjectionExpression="entryId",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check entries: {e}")

    return {"completed": bool(response.get("Items"))}


@router.put("/{entry_id}", response_model=JournalEntryOut)
def update_entry(entry_id: str, timestamp: str, entry: JournalEntryIn):
    try:
        response = table.update_item(
            Key={"userId": entry.userId, "timestamp": timestamp},
            UpdateExpression=(
                "SET #mood = :mood, moodLabel = :moodLabel, "
                "moodIcon = :moodIcon, answers = :answers, "
                "shareWithFriends = :shareWithFriends, shareMessage = :shareMessage, "
                "wantsCheckIn = :wantsCheckIn"
            ),
            ExpressionAttributeNames={"#mood": "mood"},
            ExpressionAttributeValues={
                ":entryId": entry_id,
                ":mood": entry.mood,
                ":moodLabel": entry.moodLabel,
                ":moodIcon": entry.moodIcon,
                ":answers": entry.answers,
                ":shareWithFriends": entry.shareWithFriends,
                ":shareMessage": entry.shareMessage.strip(),
                ":wantsCheckIn": entry.wantsCheckIn if entry.shareWithFriends else False,
            },
            ConditionExpression="entryId = :entryId",
            ReturnValues="ALL_NEW",
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise HTTPException(status_code=404, detail="Entry not found") from error
        raise HTTPException(status_code=500, detail=f"Failed to update entry: {error}")

    try:
        if entry.shareWithFriends:
            publish_shared_check_in(entry, entry_id, response["Attributes"]["timestamp"])
        else:
            remove_shared_check_in(entry.userId, entry_id)
    except Exception:
        logger.exception("Journal entry updated, but its social check-in could not be synchronized.")

    return response["Attributes"]


@router.delete("/{entry_id}")
def delete_entry(entry_id: str, userId: str, timestamp: str):
    try:
        table.delete_item(Key={"userId": userId, "timestamp": timestamp})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete entry: {e}")

    return {"status": "deleted", "entryId": entry_id}
