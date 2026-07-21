import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from database import (
    PROFILE_PICTURES_BUCKET,
    ensure_profile_pictures_bucket,
    s3,
    update_profile_picture,
)

router = APIRouter(prefix="/profile-pictures", tags=["profile-pictures"])


@router.post("")
async def upload_profile_picture(
    email: str = Form(...), image: UploadFile = File(...)
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The image file is empty.")

    picture_key = f"profile-pictures/{email}/{uuid.uuid4()}"

    try:
        ensure_profile_pictures_bucket()
        s3.put_object(
            Bucket=PROFILE_PICTURES_BUCKET,
            Key=picture_key,
            Body=image_bytes,
            ContentType=image.content_type,
        )
        update_profile_picture(email, picture_key)
    except Exception as error:
        raise HTTPException(
            status_code=500, detail=f"Failed to upload profile picture: {error}"
        ) from error

    return {"profilePictureKey": picture_key}
