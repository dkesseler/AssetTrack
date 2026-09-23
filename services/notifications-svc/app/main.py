"""notifications-svc — receives webhooks from other services and stubs out
email/Slack delivery by logging and persisting to a local SQLite event log.
"""

import logging
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("notifications-svc")

DB_PATH = Path(os.getenv("NOTIFICATIONS_DB_PATH", "/data/notifications.db"))


def _init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                received_at TEXT NOT NULL,
                source TEXT NOT NULL,
                payload TEXT NOT NULL
            )
        """)
        conn.commit()


_init_db()
app = FastAPI(title="notifications-svc", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "notifications-svc"}


def _store(source: str, payload: dict[str, Any]) -> int:
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute(
            "INSERT INTO events(received_at, source, payload) VALUES(?, ?, ?)",
            (datetime.now(timezone.utc).isoformat(), source, str(payload)),
        )
        conn.commit()
        return cur.lastrowid or -1


@app.post("/webhooks/assignment")
async def assignment_webhook(request: Request) -> dict[str, Any]:
    payload = await request.json()
    event_id = _store("workforce-svc/assignment", payload)
    # Stub email + Slack delivery.
    log.info("[email-stub] would email helpdesk about assignment event: %s", payload)
    log.info("[slack-stub] would post to #it-assets: %s", payload)
    return {"received": True, "event_id": event_id}


@app.get("/events")
def list_events(limit: int = 50) -> list[dict[str, Any]]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, received_at, source, payload FROM events ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]
