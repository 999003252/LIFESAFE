from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import ACCOUNTS_TABLE

router = APIRouter(prefix="/accounts", tags=["accounts"])


class AccountIn(BaseModel):
    email: str
    firstName: str
    lastName: str


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
    item = ACCOUNTS_TABLE.get_item(Key={"email": normalize_email(email)}).get("Item")
    return {"exists": item is not None}
