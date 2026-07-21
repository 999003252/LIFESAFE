import os
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))

for environment_name, lowercase_name in {
    "AWS_ACCESS_KEY_ID": "aws_access_key_id",
    "AWS_SECRET_ACCESS_KEY": "aws_secret_access_key",
    "AWS_SESSION_TOKEN": "aws_session_token",
    "AWS_REGION": "aws_region",
}.items():
    if not os.environ.get(environment_name) and os.environ.get(lowercase_name):
        os.environ[environment_name] = os.environ[lowercase_name]

if not os.environ.get("AWS_REGION") and os.environ.get("region"):
    os.environ["AWS_REGION"] = os.environ["region"]

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
s3 = boto3.client("s3", region_name=AWS_REGION)
PROFILE_PICTURES_BUCKET = "lifesafe-profile-pictures-team6"


def get_table(table_name_env_var: str, default_name: str):
    table_name = os.environ.get(table_name_env_var, default_name)
    return dynamodb.Table(table_name)


JOURNAL_ENTRIES_TABLE = get_table("DYNAMODB_TABLE_NAME", "JournalEntries")
USER_PROFILES_TABLE = get_table("USER_PROFILES_TABLE_NAME", "LifesafeUserProfiles")
USER_SEARCH_TABLE = get_table("USER_SEARCH_TABLE_NAME", "LifesafeUserSearch")
FRIENDSHIPS_TABLE = get_table("FRIENDSHIPS_TABLE_NAME", "LifesafeFriendships")
MESSAGES_TABLE = get_table("MESSAGES_TABLE_NAME", "LifesafeMessages")
CONNECTIONS_TABLE = get_table("CONNECTIONS_TABLE_NAME", "LifesafeWebSocketConnections")


def ensure_profile_pictures_bucket():
    try:
        s3.head_bucket(Bucket=PROFILE_PICTURES_BUCKET)
    except ClientError:
        create_args = {"Bucket": PROFILE_PICTURES_BUCKET}
        if AWS_REGION != "us-east-1":
            create_args["CreateBucketConfiguration"] = {
                "LocationConstraint": AWS_REGION
            }
        s3.create_bucket(**create_args)


def ensure_table(table, key_schema, attribute_definitions, global_indexes=None):
    """Return a DynamoDB table, creating it when it is missing."""
    client = dynamodb.meta.client

    try:
        client.describe_table(TableName=table.name)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ResourceNotFoundException":
            raise

        create_args = {
            "TableName": table.name,
            "KeySchema": key_schema,
            "AttributeDefinitions": attribute_definitions,
            "BillingMode": "PAY_PER_REQUEST",
        }
        if global_indexes:
            create_args["GlobalSecondaryIndexes"] = global_indexes

        try:
            dynamodb.create_table(**create_args)
        except ClientError as create_error:
            if create_error.response.get("Error", {}).get("Code") != "ResourceInUseException":
                raise

    client.get_waiter("table_exists").wait(TableName=table.name)
    return table


def ensure_journal_entries_table():
    return ensure_table(
        JOURNAL_ENTRIES_TABLE,
        key_schema=[
            {"AttributeName": "userId", "KeyType": "HASH"},
            {"AttributeName": "timestamp", "KeyType": "RANGE"},
        ],
        attribute_definitions=[
            {"AttributeName": "userId", "AttributeType": "S"},
            {"AttributeName": "timestamp", "AttributeType": "S"},
        ],
    )


def ensure_social_tables():
    ensure_table(
        USER_PROFILES_TABLE,
        key_schema=[{"AttributeName": "userId", "KeyType": "HASH"}],
        attribute_definitions=[{"AttributeName": "userId", "AttributeType": "S"}],
    )
    ensure_table(
        USER_SEARCH_TABLE,
        key_schema=[
            {"AttributeName": "searchPrefix", "KeyType": "HASH"},
            {"AttributeName": "userId", "KeyType": "RANGE"},
        ],
        attribute_definitions=[
            {"AttributeName": "searchPrefix", "AttributeType": "S"},
            {"AttributeName": "userId", "AttributeType": "S"},
        ],
    )
    ensure_table(
        FRIENDSHIPS_TABLE,
        key_schema=[
            {"AttributeName": "userId", "KeyType": "HASH"},
            {"AttributeName": "friendId", "KeyType": "RANGE"},
        ],
        attribute_definitions=[
            {"AttributeName": "userId", "AttributeType": "S"},
            {"AttributeName": "friendId", "AttributeType": "S"},
        ],
    )
    ensure_table(
        MESSAGES_TABLE,
        key_schema=[
            {"AttributeName": "conversationId", "KeyType": "HASH"},
            {"AttributeName": "messageKey", "KeyType": "RANGE"},
        ],
        attribute_definitions=[
            {"AttributeName": "conversationId", "AttributeType": "S"},
            {"AttributeName": "messageKey", "AttributeType": "S"},
        ],
    )
    ensure_table(
        CONNECTIONS_TABLE,
        key_schema=[{"AttributeName": "connectionId", "KeyType": "HASH"}],
        attribute_definitions=[
            {"AttributeName": "connectionId", "AttributeType": "S"},
            {"AttributeName": "userId", "AttributeType": "S"},
        ],
        global_indexes=[
            {
                "IndexName": "UserConnectionsIndex",
                "KeySchema": [
                    {"AttributeName": "userId", "KeyType": "HASH"},
                    {"AttributeName": "connectionId", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )


def update_profile_picture(user_id: str, picture_key: str):
    USER_PROFILES_TABLE.update_item(
        Key={"userId": user_id.lower()},
        UpdateExpression="SET profilePictureKey = :pictureKey",
        ExpressionAttributeValues={":pictureKey": picture_key},
    )
