from contextlib import asynccontextmanager
import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import (
    ensure_accounts_table,
    ensure_journal_entries_table,
    ensure_social_tables,
)
from routers import (
    accounts,
    ai_support,
    entries,
    friends,
    messages,
    profile_pictures,
    realtime,
    users,
)
from setup_realtime import setup_realtime

logger = logging.getLogger("uvicorn.error")
aws_resources_ready = False


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Provision required cloud resources before accepting requests."""
    if not aws_resources_ready:
        setup_realtime()
    logger.info("AWS WebSocket resources are ready.")
    table = ensure_journal_entries_table()
    logger.info("DynamoDB table '%s' is ready.", table.name)
    accounts_table = ensure_accounts_table()
    logger.info("DynamoDB table '%s' is ready.", accounts_table.name)
    ensure_social_tables()
    logger.info("Friends and messaging tables are ready.")
    yield


app = FastAPI(title="Lifesafe API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entries.router)
app.include_router(accounts.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(messages.router)
app.include_router(ai_support.router)
app.include_router(realtime.router)
app.include_router(profile_pictures.router)


@app.get("/")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    try:
        setup_realtime()
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from None

    aws_resources_ready = True
    uvicorn.run(app, host="0.0.0.0", port=8000)
