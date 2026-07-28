"""Deploy the AWS-managed WebSocket API used by Lifesafe messages."""

import io
import hashlib
import os
import sys
import zipfile
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
ENV_PATH = BACKEND_DIR / ".env"
TEMPLATE_PATH = BACKEND_DIR / "realtime" / "template.yaml"
HANDLER_PATH = BACKEND_DIR / "realtime" / "handlers.py"
AI_SUPPORT_PATH = BACKEND_DIR / "ai_support.py"
LEARNER_TOKEN_URL = (
    "https://awsacademy.instructure.com/courses/170506/modules/items/16715669"
)

load_dotenv(ENV_PATH)

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

STACK_NAME = os.environ.get("LIFESAFE_REALTIME_STACK", "lifesafe-realtime")
REGION = os.environ.get("AWS_REGION", "us-east-1")


def table_name(variable: str, default: str) -> str:
    return os.environ.get(variable, default)


def deployment_bucket(session) -> str:
    account_id = session.client("sts").get_caller_identity()["Account"]
    return os.environ.get(
        "LIFESAFE_DEPLOYMENT_BUCKET", f"lifesafe-realtime-{account_id}-{REGION}"
    )


def ensure_bucket(s3, bucket: str):
    try:
        s3.head_bucket(Bucket=bucket)
        return
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") not in {"404", "NoSuchBucket"}:
            raise

    arguments = {"Bucket": bucket}
    if REGION != "us-east-1":
        arguments["CreateBucketConfiguration"] = {"LocationConstraint": REGION}
    s3.create_bucket(**arguments)


def upload_handler(s3, bucket: str) -> str:
    archive = io.BytesIO()
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.write(HANDLER_PATH, "handlers.py")
        zip_file.write(AI_SUPPORT_PATH, "ai_support.py")

    contents = archive.getvalue()
    key = f"lifesafe-realtime/handlers-{hashlib.sha256(contents).hexdigest()[:12]}.zip"
    s3.put_object(Bucket=bucket, Key=key, Body=contents)
    return key


def stack_parameters(bucket: str, artifact_key: str, lambda_role_arn: str) -> list[dict]:
    return [
        {"ParameterKey": "ArtifactBucket", "ParameterValue": bucket},
        {"ParameterKey": "ArtifactKey", "ParameterValue": artifact_key},
        {"ParameterKey": "ExistingLambdaRoleArn", "ParameterValue": lambda_role_arn},
        {
            "ParameterKey": "UserProfilesTableName",
            "ParameterValue": table_name("USER_PROFILES_TABLE_NAME", "LifesafeUserProfiles"),
        },
        {
            "ParameterKey": "UserSearchTableName",
            "ParameterValue": table_name("USER_SEARCH_TABLE_NAME", "LifesafeUserSearch"),
        },
        {
            "ParameterKey": "FriendshipsTableName",
            "ParameterValue": table_name("FRIENDSHIPS_TABLE_NAME", "LifesafeFriendships"),
        },
        {
            "ParameterKey": "MessagesTableName",
            "ParameterValue": table_name("MESSAGES_TABLE_NAME", "LifesafeMessages"),
        },
        {
            "ParameterKey": "ConnectionsTableName",
            "ParameterValue": table_name(
                "CONNECTIONS_TABLE_NAME", "LifesafeWebSocketConnections"
            ),
        },
    ]


def create_stack(cloudformation, template_body: str, parameters: list[dict]):
    cloudformation.create_stack(
        StackName=STACK_NAME,
        TemplateBody=template_body,
        Parameters=parameters,
        Capabilities=["CAPABILITY_IAM"],
    )
    cloudformation.get_waiter("stack_create_complete").wait(StackName=STACK_NAME)


def deploy_stack(cloudformation, parameters: list[dict]):
    template_body = TEMPLATE_PATH.read_text()
    try:
        stack = cloudformation.describe_stacks(StackName=STACK_NAME)["Stacks"][0]
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ValidationError":
            raise
        create_stack(cloudformation, template_body, parameters)
        return

    if stack["StackStatus"] == "ROLLBACK_COMPLETE":
        cloudformation.delete_stack(StackName=STACK_NAME)
        cloudformation.get_waiter("stack_delete_complete").wait(StackName=STACK_NAME)
        create_stack(cloudformation, template_body, parameters)
        return

    try:
        cloudformation.update_stack(
            StackName=STACK_NAME,
            TemplateBody=template_body,
            Parameters=parameters,
            Capabilities=["CAPABILITY_IAM"],
        )
        cloudformation.get_waiter("stack_update_complete").wait(StackName=STACK_NAME)
    except ClientError as error:
        if "No updates are to be performed" not in str(error):
            raise


def update_env(values: dict[str, str]):
    lines = ENV_PATH.read_text().splitlines() if ENV_PATH.exists() else []
    pending = dict(values)
    updated = []
    for line in lines:
        name = line.split("=", 1)[0] if "=" in line else ""
        if name in pending:
            updated.append(f"{name}={pending.pop(name)}")
        else:
            updated.append(line)
    updated.extend(f"{name}={value}" for name, value in pending.items())
    ENV_PATH.write_text("\n".join(updated) + "\n")
    os.environ.update(values)


def setup_realtime():
    """Create or update the WebSocket stack and return its generated settings."""
    session = boto3.Session(region_name=REGION)
    s3 = session.client("s3")
    cloudformation = session.client("cloudformation")

    try:
        bucket = deployment_bucket(session)
        ensure_bucket(s3, bucket)
        artifact_key = upload_handler(s3, bucket)
        account_id = session.client("sts").get_caller_identity()["Account"]
        lambda_role_arn = os.environ.get(
            "LIFESAFE_LAMBDA_ROLE_ARN", f"arn:aws:iam::{account_id}:role/LabRole"
        )
        deploy_stack(
            cloudformation,
            stack_parameters(bucket, artifact_key, lambda_role_arn),
        )
        outputs = cloudformation.describe_stacks(StackName=STACK_NAME)["Stacks"][0][
            "Outputs"
        ]
    except ClientError as error:
        error_code = error.response.get("Error", {}).get("Code")
        if error_code in {"ExpiredToken", "ExpiredTokenException"}:
            raise RuntimeError(
                f"Please refresh learner token from {LEARNER_TOKEN_URL}"
            ) from None
        raise RuntimeError(
            "AWS setup failed. Refresh credentials and verify S3, CloudFormation, "
            "DynamoDB, Lambda, API Gateway, and IAM permissions."
        ) from error

    values = {output["OutputKey"]: output["OutputValue"] for output in outputs}
    settings = {
        "WEBSOCKET_URL": values["WebSocketUrl"],
        "USER_PROFILES_TABLE_NAME": values["UserProfilesTableName"],
        "USER_SEARCH_TABLE_NAME": values["UserSearchTableName"],
        "FRIENDSHIPS_TABLE_NAME": values["FriendshipsTableName"],
        "MESSAGES_TABLE_NAME": values["MessagesTableName"],
        "CONNECTIONS_TABLE_NAME": values["ConnectionsTableName"],
    }
    update_env(settings)
    return settings


def main():
    try:
        setup_realtime()
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error

    print("Real-time messaging is ready. Start the backend with python3 main.py.")


if __name__ == "__main__":
    main()
