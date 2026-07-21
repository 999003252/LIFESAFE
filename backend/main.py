from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import ensure_journal_entries_table, ensure_social_tables
from routers import entries, friends, messages, profile_pictures, realtime, users

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Provision required cloud resources before accepting requests."""
    table = ensure_journal_entries_table()
    logger.info("DynamoDB table '%s' is ready.", table.name)
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
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(messages.router)
app.include_router(realtime.router)
app.include_router(profile_pictures.router)


@app.get("/")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
