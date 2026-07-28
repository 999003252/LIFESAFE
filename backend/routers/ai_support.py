"""Streaming OpenAI-backed support contact."""

import hashlib
import json
import logging
import os
import ssl
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone

import certifi
from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ai_support import (
    AI_SUPPORT_ID,
    AI_SUPPORT_SYSTEM_PROMPT,
    DEFAULT_OPENAI_MODEL,
    build_openai_input,
    is_high_risk_message,
    parse_openai_stream_line,
)
from database import MESSAGES_TABLE
from routers.users import normalize_user_id

router = APIRouter(prefix="/ai-support", tags=["ai-support"])
logger = logging.getLogger("uvicorn.error")


class AiMessageIn(BaseModel):
    """A message sent to the streaming AI contact."""

    userId: str
    text: str


def conversation_id(user_id, friend_id):
    """Return the stable DynamoDB conversation partition key."""
    participants = ":".join(sorted([user_id, friend_id]))
    return hashlib.sha256(participants.encode("utf-8")).hexdigest()


def create_message(sender_id, recipient_id, text):
    """Create a message item using the existing messaging schema."""
    sent_at = datetime.now(timezone.utc).isoformat()
    return {
        "conversationId": conversation_id(sender_id, recipient_id),
        "messageKey": f"{sent_at}#{uuid.uuid4()}",
        "messageId": str(uuid.uuid4()),
        "senderId": sender_id,
        "recipientId": recipient_id,
        "text": text,
        "sentAt": sent_at,
    }


def recent_messages(user_id):
    """Load recent Therapist context in chronological order."""
    result = MESSAGES_TABLE.query(
        KeyConditionExpression=Key("conversationId").eq(
            conversation_id(user_id, AI_SUPPORT_ID)
        ),
        ScanIndexForward=False,
        Limit=12,
    )
    return list(reversed(result.get("Items", [])))


def openai_response_stream(user_id, latest_text):
    """Open a streaming Responses API request without exposing the API key."""
    history = recent_messages(user_id)
    history.append({"senderId": user_id, "text": latest_text})
    instructions = AI_SUPPORT_SYSTEM_PROMPT
    if is_high_risk_message(latest_text):
        instructions += (
            "\n\nThe latest message may indicate immediate risk. Follow the "
            "crisis guidance in your instructions now and do not continue "
            "with ordinary coaching."
        )

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not configured.")

    body = {
        "model": os.environ.get("OPENAI_MODEL", DEFAULT_OPENAI_MODEL),
        "instructions": instructions,
        "input": build_openai_input(history),
        "stream": True,
        "max_output_tokens": 350,
        "reasoning": {"effort": "none"},
        "text": {"verbosity": "low"},
        "safety_identifier": hashlib.sha256(user_id.encode("utf-8")).hexdigest(),
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    context = ssl.create_default_context(cafile=certifi.where())
    return urllib.request.urlopen(request, timeout=30, context=context)


def stream_event(payload):
    """Serialize one newline-delimited event for the frontend."""
    return f"{json.dumps(payload, separators=(',', ':'))}\n"


def generate_stream(user_id, text):
    """Yield user, delta, completion, or explicit error events."""
    try:
        openai_stream = openai_response_stream(user_id, text)
    except (urllib.error.URLError, ValueError) as error:
        logger.warning("OpenAI request failed: %s", error.__class__.__name__)
        yield stream_event(
            {
                "type": "messageError",
                "detail": "Therapist could not start a response. Please try again.",
            }
        )
        return

    user_message = create_message(user_id, AI_SUPPORT_ID, text)
    MESSAGES_TABLE.put_item(Item=user_message)
    yield stream_event({"type": "message", "message": user_message})

    reply = create_message(AI_SUPPORT_ID, user_id, "")
    yield stream_event({"type": "aiMessageStarted", "message": reply})
    chunks = []

    try:
        with openai_stream:
            for raw_line in openai_stream:
                event = parse_openai_stream_line(raw_line)
                if not event:
                    continue
                event_type = event.get("type")
                if event_type == "response.output_text.delta":
                    delta = event.get("delta", "")
                    if not delta:
                        continue
                    chunks.append(delta)
                    yield stream_event(
                        {
                            "type": "aiMessageDelta",
                            "messageId": reply["messageId"],
                            "friendId": AI_SUPPORT_ID,
                            "delta": delta,
                        }
                    )
                elif event_type in (
                    "error",
                    "response.failed",
                    "response.incomplete",
                ):
                    raise ValueError("OpenAI stream failed.")

        reply["text"] = "".join(chunks).strip()
        if not reply["text"]:
            raise ValueError("OpenAI returned no text.")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        logger.warning("OpenAI stream failed: %s", error.__class__.__name__)
        yield stream_event(
            {
                "type": "aiMessageError",
                "messageId": reply["messageId"],
                "friendId": AI_SUPPORT_ID,
                "detail": "Therapist could not finish the response. Please try again.",
            }
        )
        return

    MESSAGES_TABLE.put_item(Item=reply)
    yield stream_event({"type": "aiMessageCompleted", "message": reply})


@router.post("/stream")
def stream_ai_message(message: AiMessageIn):
    """Validate a message and stream its OpenAI-backed response."""
    user_id = normalize_user_id(message.userId)
    text = message.text.strip()
    if "@" not in user_id:
        raise HTTPException(status_code=401, detail="A signed-in email is required.")
    if not text or len(text) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Enter a message up to 2,000 characters.",
        )

    return StreamingResponse(
        generate_stream(user_id, text),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
