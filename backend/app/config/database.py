"""
Firestore helper — provides get_col() to access Firestore collections.
All services import from here instead of using MongoDB/Motor.

Migration notes (MongoDB → Firebase):
- Removed: MockCollection, MockCursor, JSONFileDatabase — these were a
  file-based MongoDB emulation fallback used during offline development.
  Since the migration to Firestore is complete they are no longer needed.
- Removed: optional `bson.ObjectId` import (was only needed by MockCollection).
- Kept: get_col(), run_in_executor(), doc_to_dict(), docs_to_list() — these
  are the reusable Firestore helpers used across all service modules.
- get_db() is re-exported from app.db.database for legacy import compatibility.
"""

import asyncio
import logging

from app.core.firebase import get_db  # noqa: F401 — re-exported for backward compatibility

logger = logging.getLogger("uvicorn.error")


# ── Firestore Helpers ─────────────────────────────────────────────────────────

def get_col(name: str):
    """Return a Firestore CollectionReference by name."""
    db = get_db()
    if db is None:
        raise RuntimeError("Firestore client is None. Cannot access collection.")
    return db.collection(name)



async def run_in_executor(fn, *args):
    """
    Run a synchronous Firestore call in a thread executor
    so it doesn't block FastAPI's event loop.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, fn, *args)


def doc_to_dict(doc) -> dict:
    """Convert a Firestore DocumentSnapshot to a plain dict with 'id' field."""
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def docs_to_list(query_snapshot) -> list:
    """Convert a Firestore QuerySnapshot to a list of dicts."""
    result = []
    for doc in query_snapshot:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        result.append(data)
    return result
