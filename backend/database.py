import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)


def get_table(table_name_env_var: str, default_name: str):
    table_name = os.environ.get(table_name_env_var, default_name)
    return dynamodb.Table(table_name)
