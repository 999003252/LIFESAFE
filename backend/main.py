from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import ensure_accounts_table, ensure_journal_entries_table
from routers import accounts, entries

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Provision required cloud resources before accepting requests."""
    table = ensure_journal_entries_table()
    logger.info("DynamoDB table '%s' is ready.", table.name)
    accounts_table = ensure_accounts_table()
    logger.info("DynamoDB table '%s' is ready.", accounts_table.name)
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


@app.get("/")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
