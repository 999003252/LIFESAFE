import os

from fastapi import APIRouter

router = APIRouter(prefix="/realtime", tags=["realtime"])


@router.get("/config")
def realtime_config():
    return {"websocketUrl": os.environ.get("WEBSOCKET_URL", "")}
