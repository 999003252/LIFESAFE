import json
import os
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import MagicMock

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
os.environ.setdefault("CONNECTIONS_TABLE_NAME", "connections")
os.environ.setdefault("FRIENDSHIPS_TABLE_NAME", "friendships")
os.environ.setdefault("MESSAGES_TABLE_NAME", "messages")
os.environ.setdefault("OPENAI_API_KEY", "testing")
os.environ.setdefault("OPENAI_MODEL", "gpt-5.4-nano")

from ai_support import (  # noqa: E402
    AI_SUPPORT_ID,
    ai_support_contact,
    build_openai_input,
    is_high_risk_message,
    parse_openai_stream_line,
)
from routers import ai_support as ai_router  # noqa: E402

REAL_OPENAI_RESPONSE_STREAM = ai_router.openai_response_stream


class FakeMessages:
    def __init__(self, history=None):
        self.history = list(history or [])
        self.saved = []

    def query(self, **_kwargs):
        return {"Items": list(reversed(self.history))}

    def put_item(self, Item):
        self.saved.append(Item)


class FakeStream:
    def __init__(self, events, failure=None):
        self.lines = [
            f"data: {json.dumps(event)}\n".encode("utf-8") for event in events
        ]
        self.failure = failure

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def __iter__(self):
        yield from self.lines
        if self.failure:
            raise self.failure


class AiSupportHelpersTest(unittest.TestCase):
    def test_virtual_contact_is_named_therapist_and_marked_as_ai(self):
        contact = ai_support_contact(
            {"text": "Take one small step", "sentAt": "2026-07-25T12:00:00Z"}
        )

        self.assertEqual(contact["userId"], AI_SUPPORT_ID)
        self.assertEqual(contact["displayName"], "Therapist")
        self.assertTrue(contact["isAi"])
        self.assertEqual(contact["lastMessagePreview"], "Take one small step")

    def test_history_is_converted_and_adjacent_roles_are_combined(self):
        result = build_openai_input(
            [
                {"senderId": AI_SUPPORT_ID, "text": "old orphan response"},
                {"senderId": "person@example.com", "text": "First thought"},
                {"senderId": "person@example.com", "text": "More context"},
                {"senderId": AI_SUPPORT_ID, "text": "Reflection"},
            ]
        )

        self.assertEqual([item["role"] for item in result], ["user", "assistant"])
        self.assertIn("More context", result[0]["content"])

    def test_high_risk_language_is_detected(self):
        self.assertTrue(is_high_risk_message("I want to kill myself."))
        self.assertTrue(is_high_risk_message("I have been thinking about suicide."))
        self.assertFalse(is_high_risk_message("I had a difficult day at work."))

    def test_responses_api_sse_line_is_parsed(self):
        event = parse_openai_stream_line(
            b'data: {"type":"response.output_text.delta","delta":"hello"}\n'
        )

        self.assertEqual(event["delta"], "hello")
        self.assertIsNone(parse_openai_stream_line(b"event: response.completed\n"))
        self.assertIsNone(parse_openai_stream_line(b"data: [DONE]\n"))


class StreamAiMessageTest(unittest.TestCase):
    def setUp(self):
        self.user_id = "person@example.com"
        self.messages = FakeMessages()
        ai_router.MESSAGES_TABLE = self.messages
        ai_router.openai_response_stream = MagicMock()

    @staticmethod
    def payloads(output):
        return [json.loads(line) for line in output]

    def test_openai_deltas_are_forwarded_saved_and_completed(self):
        ai_router.openai_response_stream.return_value = FakeStream(
            [
                {"type": "response.created"},
                {
                    "type": "response.output_text.delta",
                    "delta": "That sounds like a lot. ",
                },
                {
                    "type": "response.output_text.delta",
                    "delta": "What feels most urgent?",
                },
                {"type": "response.completed"},
            ]
        )

        payloads = self.payloads(
            list(ai_router.generate_stream(self.user_id, "I feel overwhelmed"))
        )

        self.assertEqual(len(self.messages.saved), 2)
        self.assertEqual(self.messages.saved[0]["senderId"], self.user_id)
        self.assertEqual(self.messages.saved[1]["senderId"], AI_SUPPORT_ID)
        self.assertEqual(
            self.messages.saved[1]["text"],
            "That sounds like a lot. What feels most urgent?",
        )
        self.assertEqual(
            [payload["type"] for payload in payloads],
            [
                "message",
                "aiMessageStarted",
                "aiMessageDelta",
                "aiMessageDelta",
                "aiMessageCompleted",
            ],
        )

    def test_openai_start_failure_saves_no_conversation_messages(self):
        ai_router.openai_response_stream.side_effect = urllib.error.HTTPError(
            "https://api.openai.com/v1/responses",
            401,
            "Unauthorized",
            {},
            None,
        )

        payloads = self.payloads(
            list(ai_router.generate_stream(self.user_id, "Hello"))
        )

        self.assertEqual(self.messages.saved, [])
        self.assertEqual([payload["type"] for payload in payloads], ["messageError"])

    def test_interrupted_stream_does_not_save_partial_ai_message(self):
        ai_router.openai_response_stream.return_value = FakeStream(
            [
                {
                    "type": "response.output_text.delta",
                    "delta": "Partial response",
                }
            ],
            failure=OSError("connection interrupted"),
        )

        payloads = self.payloads(
            list(ai_router.generate_stream(self.user_id, "Hello"))
        )

        self.assertEqual(len(self.messages.saved), 1)
        self.assertEqual(self.messages.saved[0]["senderId"], self.user_id)
        self.assertEqual(
            [payload["type"] for payload in payloads],
            [
                "message",
                "aiMessageStarted",
                "aiMessageDelta",
                "aiMessageError",
            ],
        )

    def test_openai_request_uses_streaming_nano_model_and_hashed_identifier(self):
        ai_router.openai_response_stream = REAL_OPENAI_RESPONSE_STREAM
        ai_router.urllib.request.urlopen = MagicMock(return_value=FakeStream([]))

        ai_router.openai_response_stream(self.user_id, "Hello")

        request = ai_router.urllib.request.urlopen.call_args.args[0]
        request_body = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request_body["model"], "gpt-5.4-nano")
        self.assertTrue(request_body["stream"])
        self.assertEqual(request_body["reasoning"], {"effort": "none"})
        self.assertNotIn(self.user_id, request_body["safety_identifier"])
        self.assertNotIn(
            os.environ["OPENAI_API_KEY"],
            request.data.decode("utf-8"),
        )

    def test_high_risk_message_adds_explicit_crisis_instruction(self):
        ai_router.openai_response_stream = REAL_OPENAI_RESPONSE_STREAM
        ai_router.urllib.request.urlopen = MagicMock(return_value=FakeStream([]))

        ai_router.openai_response_stream(
            self.user_id,
            "I am thinking about suicide.",
        )

        request = ai_router.urllib.request.urlopen.call_args.args[0]
        request_body = json.loads(request.data.decode("utf-8"))
        self.assertIn("immediate risk", request_body["instructions"])
        self.assertIn("emergency service", request_body["instructions"])


if __name__ == "__main__":
    unittest.main()
