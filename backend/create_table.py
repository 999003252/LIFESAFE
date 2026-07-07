"""One-off script to provision the DynamoDB table used by routers/entries.py.

Run once after putting your AWS credentials in backend/.env:

    python create_table.py
"""
import os

from dotenv import load_dotenv

load_dotenv()

from database import dynamodb

TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "JournalEntries")


def main():
    existing_tables = dynamodb.meta.client.list_tables()["TableNames"]
    if TABLE_NAME in existing_tables:
        print(f"Table '{TABLE_NAME}' already exists.")
        return

    table = dynamodb.create_table(
        TableName=TABLE_NAME,
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
    print(f"Creating table '{TABLE_NAME}', waiting until it's active...")
    table.wait_until_exists()
    print("Done.")


if __name__ == "__main__":
    main()
