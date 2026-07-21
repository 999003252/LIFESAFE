import re
from datetime import datetime, timezone

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import USER_PROFILES_TABLE, USER_SEARCH_TABLE

router = APIRouter(prefix="/users", tags=["users"])


class UserProfileIn(BaseModel):
    email: str
    firstName: str
    lastName: str


def normalize_user_id(value: str) -> str:
    return value.strip().lower()


def profile_response(profile: dict) -> dict:
    return {
        "userId": profile["userId"],
        "firstName": profile["firstName"],
        "lastName": profile["lastName"],
        "displayName": profile["displayName"],
        "profilePictureKey": profile.get("profilePictureKey"),
    }


def search_prefixes(*values: str) -> set[str]:
    prefixes = set()
    for value in values:
        normalized = re.sub(r"\s+", " ", value.strip().lower())
        for index in range(2, len(normalized) + 1):
            prefixes.add(normalized[:index])
    return prefixes


def get_profile(user_id: str) -> dict | None:
    return USER_PROFILES_TABLE.get_item(Key={"userId": normalize_user_id(user_id)}).get(
        "Item"
    )


@router.put("/profile")
def upsert_profile(profile: UserProfileIn):
    user_id = normalize_user_id(profile.email)
    first_name = profile.firstName.strip()
    last_name = profile.lastName.strip()

    if "@" not in user_id or not first_name or not last_name:
        raise HTTPException(status_code=400, detail="Enter a name and valid email address.")

    display_name = f"{first_name} {last_name}"
    existing = get_profile(user_id)
    previous_prefixes = set(existing.get("searchPrefixes", [])) if existing else set()
    prefixes = search_prefixes(first_name, last_name, display_name, user_id)
    timestamp = datetime.now(timezone.utc).isoformat()

    item = {
        "userId": user_id,
        "firstName": first_name,
        "lastName": last_name,
        "displayName": display_name,
        "searchPrefixes": list(prefixes),
        "updatedAt": timestamp,
    }
    if existing and existing.get("profilePictureKey"):
        item["profilePictureKey"] = existing["profilePictureKey"]

    try:
        USER_PROFILES_TABLE.put_item(Item=item)
        with USER_SEARCH_TABLE.batch_writer() as batch:
            for prefix in previous_prefixes - prefixes:
                batch.delete_item(Key={"searchPrefix": prefix, "userId": user_id})
            for prefix in prefixes:
                batch.put_item(Item={"searchPrefix": prefix, "userId": user_id})
    except Exception as error:
        raise HTTPException(status_code=500, detail="Could not save the profile.") from error

    return profile_response(item)


@router.get("")
def search_users(query: str, viewerId: str):
    search_term = re.sub(r"\s+", " ", query.strip().lower())
    viewer_id = normalize_user_id(viewerId)

    if len(search_term) < 2:
        return []

    try:
        response = USER_SEARCH_TABLE.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("searchPrefix").eq(
                search_term
            ),
            Limit=20,
        )
        user_ids = [
            item["userId"]
            for item in response.get("Items", [])
            if item["userId"] != viewer_id
        ]
        if not user_ids:
            return []

        profiles = []
        batch_response = USER_PROFILES_TABLE.meta.client.batch_get_item(
            RequestItems={
                USER_PROFILES_TABLE.name: {
                    "Keys": [{"userId": user_id} for user_id in user_ids]
                }
            }
        )
        profiles_by_id = {
            item["userId"]: item
            for item in batch_response.get("Responses", {}).get(USER_PROFILES_TABLE.name, [])
        }
        for user_id in user_ids:
            if user_id in profiles_by_id:
                profiles.append(profile_response(profiles_by_id[user_id]))
        return profiles
    except Exception as error:
        raise HTTPException(status_code=500, detail="Could not search users.") from error
