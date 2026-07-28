from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import boto3
import uuid

from database import ACCOUNTS_TABLE, USER_PROFILES_TABLE

router = APIRouter(prefix="/accounts", tags=["accounts"])
s3 = boto3.client("s3")

PROFILE_BUCKET = "lifesafe-profile-pictures-team6"

class AccountIn(BaseModel):
    email: str
    firstName: str
    lastName: str
    profileImageUrl: str | None = None


def normalize_email(email: str) -> str:
    return email.strip().lower()


@router.post("")
def create_account(account: AccountIn):
    email = normalize_email(account.email)
    first_name = account.firstName.strip()
    last_name = account.lastName.strip()

    if "@" not in email or not first_name or not last_name:
        raise HTTPException(status_code=400, detail="Enter a name and valid email address.")

    try:
        ACCOUNTS_TABLE.put_item(
            Item={
                "email": email,
                "firstName": first_name,
                "lastName": last_name,
                 "profileImageUrl": account.profileImageUrl,
            },
            ConditionExpression="attribute_not_exists(email)",
        )
    except ACCOUNTS_TABLE.meta.client.exceptions.ConditionalCheckFailedException as error:
        raise HTTPException(status_code=409, detail="An account already exists for this email.") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Could not save the account.") from error

    return {"email": email, "firstName": first_name, "lastName": last_name}


@router.get("/exists")
def account_exists(email: str):
    normalized_email = normalize_email(email)
    account = ACCOUNTS_TABLE.get_item(Key={"email": normalized_email}).get("Item")
    if account is not None:
        return {"exists": True}

    profile = USER_PROFILES_TABLE.get_item(
        Key={"userId": normalized_email}
    ).get("Item")
    return {"exists": profile is not None}


@router.get("")
def get_account(email: str):
    normalized_email = normalize_email(email)
    item = ACCOUNTS_TABLE.get_item(Key={"email": normalized_email}).get("Item")

    if item is None:
        profile = USER_PROFILES_TABLE.get_item(
            Key={"userId": normalized_email}
        ).get("Item")
        if profile is not None:
            item = {
                "email": profile["userId"],
                "firstName": profile["firstName"],
                "lastName": profile.get("lastName", ""),
                "profileImageKey": profile.get("profilePictureKey"),
            }

    if item is None:
        raise HTTPException(status_code=404, detail="Account not found.")

    profile_image_url = None

    if item.get("profileImageKey"):
        profile_image_url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": PROFILE_BUCKET,
                "Key": item["profileImageKey"]
            },
            ExpiresIn=3600
        )

    return {
        "email": item["email"],
        "firstName": item["firstName"],
        "lastName": item["lastName"],
        "profileImageUrl": profile_image_url
    }

@router.post("/profile-picture")
async def upload_profile_picture(
    email: str,
    file: UploadFile = File(...)
):
    try:
        file_extension = file.filename.split(".")[-1]
        filename = f"profile-pictures/{uuid.uuid4()}.{file_extension}"

        s3.upload_fileobj(
            file.file,
            PROFILE_BUCKET,
            filename,
            ExtraArgs={
                "ContentType": file.content_type
            }
        )

        ACCOUNTS_TABLE.update_item(
    Key={"email": normalize_email(email)},
    UpdateExpression="SET profileImageKey = :key",
    ExpressionAttributeValues={
        ":key": filename
    }
)

        return {
    "profileImageKey": filename
}

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Could not upload profile picture."
        ) from error
