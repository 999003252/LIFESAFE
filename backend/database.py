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


def get_table(table_name_env_var: str, default_name: str):
    table_name = os.environ.get(table_name_env_var, default_name)
    return dynamodb.Table(table_name)


ACCOUNTS_TABLE = get_table("ACCOUNTS_TABLE_NAME", "LifesafeAccounts")


def ensure_journal_entries_table():
    """Return the journal table, creating it when it does not exist."""
    table = get_table("DYNAMODB_TABLE_NAME", "JournalEntries")
    client = dynamodb.meta.client

    try:
        client.describe_table(TableName=table.name)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ResourceNotFoundException":
            raise

        try:
            dynamodb.create_table(
                TableName=table.name,
                KeySchema=[
                    {"AttributeName": "userId", "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"},
                ],
                AttributeDefinitions=[
                    {"AttributeName": "userId", "AttributeType": "S"},
                    {"AttributeName": "timestamp", "AttributeType": "S"},
                ],
                BillingMode="PAY_PER_REQUEST",
            )
        except ClientError as create_error:
            # Another app instance may have created the table after our check.
            if create_error.response.get("Error", {}).get("Code") != "ResourceInUseException":
                raise

    client.get_waiter("table_exists").wait(TableName=table.name)
    return table


def ensure_accounts_table():
    """Return the account directory table, creating it when it is missing."""
    client = dynamodb.meta.client

    try:
        client.describe_table(TableName=ACCOUNTS_TABLE.name)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ResourceNotFoundException":
            raise

        try:
            dynamodb.create_table(
                TableName=ACCOUNTS_TABLE.name,
                KeySchema=[{"AttributeName": "email", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "email", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST",
            )
        except ClientError as create_error:
            if create_error.response.get("Error", {}).get("Code") != "ResourceInUseException":
                raise

    client.get_waiter("table_exists").wait(TableName=ACCOUNTS_TABLE.name)
    return ACCOUNTS_TABLE
