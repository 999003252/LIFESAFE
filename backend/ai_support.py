"""Shared configuration and safety rules for the OpenAI support companion."""

import json
import re

AI_SUPPORT_ID = "therapist@lifesafe.local"
AI_SUPPORT_NAME = "Therapist"
DEFAULT_OPENAI_MODEL = "gpt-5.4-nano"

AI_SUPPORT_SYSTEM_PROMPT = """
You are the AI companion behind LifeSafe's contact named "Therapist." You are
not a licensed therapist, doctor, or emergency service. Never imply otherwise.
Help the user talk through feelings with warmth, respect, and practical
grounding.

Keep responses concise: usually one or two short paragraphs followed by at most
one gentle question. Reflect what the user shared, validate emotions without
endorsing harmful beliefs, and offer small practical next steps when helpful.
Encourage trusted people and qualified professionals when the concern is serious
or ongoing. Use plain text only, without Markdown formatting.

Never diagnose, prescribe, recommend medication changes, claim confidentiality,
or imply that you replace professional care. Never encourage dependency,
exclusivity, secrecy, self-harm, violence, substance misuse, or illegal conduct.
Do not call yourself a therapist.

If the user may be at immediate risk of harming themselves or someone else, say
clearly that you are an AI and not an emergency service. Encourage them to call
local emergency services or go to the nearest emergency department, move away
from means of harm if safe, and contact a trusted person who can stay with them.
Ask whether they are in immediate danger right now.
""".strip()

_HIGH_RISK_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\bkill (?:myself|him|her|them|someone)\b",
        r"\b(?:suicide|suicidal)\b",
        r"\bend my life\b",
        r"\b(?:do not|don't|dont) want to (?:live|be alive)\b",
        r"\bhurt (?:myself|someone|him|her|them)\b",
        r"\bself[- ]?harm\b",
        r"\boverdose\b",
    )
)


def ai_support_contact(last_message=None):
    """Return the virtual contact shown at the top of every message list."""
    return {
        "userId": AI_SUPPORT_ID,
        "displayName": AI_SUPPORT_NAME,
        "profilePictureUrl": None,
        "isAi": True,
        "lastMessagePreview": (
            last_message.get("text", "Talk through what is on your mind")[:80]
            if last_message
            else "Talk through what is on your mind"
        ),
        "lastMessageAt": last_message.get("sentAt") if last_message else None,
        "unreadCount": 0,
    }


def is_high_risk_message(text):
    """Return whether a message needs explicit crisis-oriented guidance."""
    return any(pattern.search(text) for pattern in _HIGH_RISK_PATTERNS)


def build_openai_input(items):
    """Convert stored DynamoDB messages into Responses API input messages."""
    result = []
    for item in items:
        role = "assistant" if item.get("senderId") == AI_SUPPORT_ID else "user"
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        if result and result[-1]["role"] == role:
            result[-1]["content"] += f"\n\n{text}"
        else:
            result.append({"role": role, "content": text})

    while result and result[0]["role"] != "user":
        result.pop(0)
    return result


def parse_openai_stream_line(raw_line):
    """Return a parsed Responses API SSE event, or None for non-data lines."""
    line = raw_line.decode("utf-8").strip()
    if not line.startswith("data: ") or line == "data: [DONE]":
        return None

    return json.loads(line[6:])
