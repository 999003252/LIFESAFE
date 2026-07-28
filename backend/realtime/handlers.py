import hashlib
import json
import os
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from ai_support import AI_SUPPORT_ID

dynamodb = boto3.resource("dynamodb")
connections = dynamodb.Table(os.environ["CONNECTIONS_TABLE_NAME"])
friendships = dynamodb.Table(os.environ["FRIENDSHIPS_TABLE_NAME"])
messages = dynamodb.Table(os.environ["MESSAGES_TABLE_NAME"])


def response(status_code, body=None):
    result = {"statusCode": status_code}
    if body is not None:
        result["body"] = json.dumps(body)
    return result


def normalize_user_id(value):
    return value.strip().lower()


def conversation_id(user_id, friend_id):
    participants = ":".join(sorted([user_id, friend_id]))
    return hashlib.sha256(participants.encode("utf-8")).hexdigest()


def create_message(sender_id, recipient_id, text):
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


def connect(event, _context):
    connection_id = event["requestContext"]["connectionId"]
    query = event.get("queryStringParameters") or {}
    user_id = normalize_user_id(query.get("userId", ""))

    if "@" not in user_id:
        return response(401, {"detail": "A signed-in email is required."})

    connections.put_item(
        Item={
            "connectionId": connection_id,
            "userId": user_id,
            "connectedAt": datetime.now(timezone.utc).isoformat(),
        }
    )
    return response(200)


def disconnect(event, _context):
    connections.delete_item(Key={"connectionId": event["requestContext"]["connectionId"]})
    return response(200)


def send_message(event, _context):
    connection_id = event["requestContext"]["connectionId"]
    connection = connections.get_item(Key={"connectionId": connection_id}).get("Item")
    if not connection:
        return response(401, {"detail": "Reconnect before sending a message."})

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"detail": "Message data is invalid."})

    recipient_id = normalize_user_id(body.get("recipientId", ""))
    text = body.get("text", "").strip()
    sender_id = connection["userId"]
    if not recipient_id or not text or len(text) > 2000:
        return response(400, {"detail": "Enter a message up to 2,000 characters."})

    if recipient_id == AI_SUPPORT_ID:
        return response(
            400,
            {"detail": "Use the Therapist streaming endpoint for this contact."},
        )

    friendship = friendships.get_item(
        Key={"userId": sender_id, "friendId": recipient_id}
    )
    if "Item" not in friendship:
        return response(403, {"detail": "You can only message friends."})

    message = create_message(sender_id, recipient_id, text)
    messages.put_item(Item=message)
    friendships.update_item(
        Key={"userId": sender_id, "friendId": recipient_id},
        UpdateExpression=(
            "SET lastMessagePreview = :text, lastMessageAt = :sentAt, "
            "lastReadAt = :sentAt, unreadCount = :zero"
        ),
        ExpressionAttributeValues={
            ":text": text[:80],
            ":sentAt": message["sentAt"],
            ":zero": 0,
        },
    )
    friendships.update_item(
        Key={"userId": recipient_id, "friendId": sender_id},
        UpdateExpression=(
            "SET lastMessagePreview = :text, lastMessageAt = :sentAt "
            "ADD unreadCount :one"
        ),
        ExpressionAttributeValues={
            ":text": text[:80],
            ":sentAt": message["sentAt"],
            ":one": 1,
        },
    )

    payload = json.dumps({"type": "message", "message": message}).encode("utf-8")
    for user_id in (sender_id, recipient_id):
        deliver_to_user(event, user_id, payload)

    return response(200, {"messageId": message["messageId"]})


def deliver_to_user(event, user_id, payload):
    endpoint = (
        f"https://{event['requestContext']['domainName']}/"
        f"{event['requestContext']['stage']}"
    )
    gateway = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)
    response = connections.query(
        IndexName="UserConnectionsIndex",
        KeyConditionExpression=Key("userId").eq(user_id),
    )

    for connection in response.get("Items", []):
        connection_id = connection["connectionId"]
        try:
            gateway.post_to_connection(ConnectionId=connection_id, Data=payload)
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") == "GoneException":
                connections.delete_item(Key={"connectionId": connection_id})
            else:
                raise
