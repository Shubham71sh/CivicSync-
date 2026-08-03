"""
Citizen service — Firestore-based profile and dashboard.
"""

import asyncio
import logging
from datetime import datetime
from fastapi import HTTPException
from app.config.database import get_col, doc_to_dict, docs_to_list

logger = logging.getLogger("uvicorn.error")


async def _get_or_create_profile(uid: str) -> dict:
    """Get citizen profile, creating a default if missing."""
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("citizens").document(uid).get())
    if doc.exists:
        data = doc.to_dict()
        data["id"] = uid
        return data
    # Create default
    now = datetime.utcnow().isoformat()
    default = {
        "uid": uid,
        "gender": "",
        "category": "General",
        "state": "",
        "occupation": "",
        "age": 0,
        "incomeRange": "",
        "verificationStatus": "Unverified",
        "connectedIds": [],
        "createdAt": now,
        "updatedAt": now,
    }
    await loop.run_in_executor(None, lambda: get_col("citizens").document(uid).set(default))
    default["id"] = uid
    return default


async def get_profile(uid: str) -> dict:
    profile = await _get_or_create_profile(uid)
    return {"citizen": profile}


async def update_profile(uid: str, updates: dict) -> dict:
    """Update citizen profile fields."""
    loop = asyncio.get_event_loop()
    updates["updatedAt"] = datetime.utcnow().isoformat()
    # Remove None values
    updates = {k: v for k, v in updates.items() if v is not None}
    await loop.run_in_executor(None, lambda: get_col("citizens").document(uid).set(updates, merge=True))
    doc = await loop.run_in_executor(None, lambda: get_col("citizens").document(uid).get())
    data = doc.to_dict()
    data["id"] = uid
    return {"citizen": data}


async def get_dashboard_stats(uid: str) -> dict:
    """Aggregate dashboard stats from Firestore collections."""
    loop = asyncio.get_event_loop()

    def _fetch():
        apps = list(get_col("applications").where("userId", "==", uid).stream())
        docs = list(get_col("documents").where("userId", "==", uid).stream())
        notifs = list(get_col("notifications").where("userId", "==", uid).where("read", "==", False).stream())
        schemes = list(get_col("schemes").stream())
        return apps, docs, notifs, schemes

    apps, docs, notifs, schemes = await loop.run_in_executor(None, _fetch)

    approved = sum(1 for a in apps if a.to_dict().get("status") == "approved")
    pending = sum(1 for a in apps if a.to_dict().get("status") in ["submitted", "pending", "under_review"])

    return {
        "stats": {
            "totalSchemes": len(schemes),
            "appliedSchemes": len(apps),
            "approvedBenefits": approved,
            "pendingApplications": pending,
            "uploadedDocuments": len(docs),
            "unreadNotifications": len(notifs),
        }
    }
