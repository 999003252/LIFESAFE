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

load_dotenv(ENV_PATH)

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

    contents = archive.getvalue()
    key = f"lifesafe-realtime/handlers-{hashlib.sha256(contents).hexdigest()[:12]}.zip"
    s3.put_object(Bucket=bucket, Key=key, Body=contents)
    return key


def stack_parameters(bucket: str, artifact_key: str) -> list[dict]:
    return [
        {"ParameterKey": "ArtifactBucket", "ParameterValue": bucket},
        {"ParameterKey": "ArtifactKey", "ParameterValue": artifact_key},
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


def deploy_stack(cloudformation, parameters: list[dict]):
    template_body = TEMPLATE_PATH.read_text()
    try:
        cloudformation.describe_stacks(StackName=STACK_NAME)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") != "ValidationError":
            raise
        cloudformation.create_stack(
            StackName=STACK_NAME,
            TemplateBody=template_body,
            Parameters=parameters,
            Capabilities=["CAPABILITY_IAM"],
        )
        cloudformation.get_waiter("stack_create_complete").wait(StackName=STACK_NAME)
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


def main():
    session = boto3.Session(region_name=REGION)
    s3 = session.client("s3")
    cloudformation = session.client("cloudformation")

    try:
        bucket = deployment_bucket(session)
        ensure_bucket(s3, bucket)
        artifact_key = upload_handler(s3, bucket)
        deploy_stack(cloudformation, stack_parameters(bucket, artifact_key))
        outputs = cloudformation.describe_stacks(StackName=STACK_NAME)["Stacks"][0][
            "Outputs"
        ]
    except ClientError as error:
        print(f"AWS setup failed: {error}", file=sys.stderr)
        print("Refresh credentials and verify the required AWS permissions, then run again.", file=sys.stderr)
        raise SystemExit(1) from error

    values = {output["OutputKey"]: output["OutputValue"] for output in outputs}
    update_env(
        {
            "WEBSOCKET_URL": values["WebSocketUrl"],
            "USER_PROFILES_TABLE_NAME": values["UserProfilesTableName"],
            "USER_SEARCH_TABLE_NAME": values["UserSearchTableName"],
            "FRIENDSHIPS_TABLE_NAME": values["FriendshipsTableName"],
            "MESSAGES_TABLE_NAME": values["MessagesTableName"],
            "CONNECTIONS_TABLE_NAME": values["ConnectionsTableName"],
        }
    )
    print("Real-time messaging is ready. Start the backend with python3 main.py.")


if __name__ == "__main__":
    main()
