import uuid
from datetime import datetime, timedelta, timezone
from typing import List

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_table

router = APIRouter(prefix="/entries", tags=["entries"])
table = get_table("DYNAMODB_TABLE_NAME", "JournalEntries")


class JournalEntryIn(BaseModel):
    userId: str
    mood: str
    moodLabel: str
    moodIcon: str
    answers: List[str]


class JournalEntryOut(JournalEntryIn):
    entryId: str
    timestamp: str


class CheckInStatus(BaseModel):
    completed: bool


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
    }

    try:
        table.put_item(Item=item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save entry: {e}")

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


@router.delete("/{entry_id}")
def delete_entry(entry_id: str, userId: str, timestamp: str):
    try:
        table.delete_item(Key={"userId": userId, "timestamp": timestamp})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete entry: {e}")

    return {"status": "deleted", "entryId": entry_id}
