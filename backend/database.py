import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)


def get_table(table_name_env_var: str, default_name: str):
    table_name = os.environ.get(table_name_env_var, default_name)
    return dynamodb.Table(table_name)


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
