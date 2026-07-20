"""
Notification service — Firestore-based.
"""

import asyncio
import uuid
import logging
from datetime import datetime
from fastapi import HTTPException
from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")


async def get_notifications(uid: str, unread_only: bool = False) -> dict:
    loop = asyncio.get_event_loop()

    def _fetch():
        ref = get_col("notifications").where("userId", "==", uid)
        if unread_only:
            ref = ref.where("read", "==", False)
        return list(ref.order_by("createdAt", direction="DESCENDING").limit(50).stream())

    try:
        docs = await loop.run_in_executor(None, _fetch)
    except Exception:
        # Fallback if index not ready
        docs = await loop.run_in_executor(None, lambda: list(
            get_col("notifications").where("userId", "==", uid).stream()
        ))

    result = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        result.append(d)

    return {"notifications": result, "unreadCount": sum(1 for n in result if not n.get("read"))}


async def mark_read(notif_id: str, uid: str) -> dict:
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("notifications").document(notif_id).get())
    if not doc.exists or doc.to_dict().get("userId") != uid:
        raise HTTPException(status_code=404, detail="Notification not found.")
    await loop.run_in_executor(None, lambda: get_col("notifications").document(notif_id).update({"read": True}))
    return {"message": "Notification marked as read."}


async def mark_all_read(uid: str) -> dict:
    loop = asyncio.get_event_loop()

    def _batch_mark():
        docs = list(get_col("notifications").where("userId", "==", uid).where("read", "==", False).stream())
        db = get_col("notifications")._client
        batch = db.batch()
        for doc in docs:
            batch.update(doc.reference, {"read": True})
        batch.commit()
        return len(docs)

    count = await loop.run_in_executor(None, _batch_mark)
    return {"message": f"Marked {count} notifications as read."}
