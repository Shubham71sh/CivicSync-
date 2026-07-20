"""
Firestore helper — provides get_col() to access Firestore collections.
All services should import and use this instead of MongoDB motor.
"""

import asyncio
from app.core.firebase import get_db


def get_col(name: str):
    """Return a Firestore CollectionReference by name."""
    return get_db().collection(name)


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
    # Remove internal Firestore references if any
    return data


def docs_to_list(query_snapshot) -> list:
    """Convert a Firestore QuerySnapshot to a list of dicts."""
    result = []
    for doc in query_snapshot:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        result.append(data)
    return result
