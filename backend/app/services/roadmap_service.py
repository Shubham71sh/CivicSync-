"""
Roadmap service — Firestore-based.
"""

import asyncio
import uuid
import logging
from datetime import datetime
from fastapi import HTTPException
from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")

DEFAULT_ITEMS = [
    {"title": "Profile Verified", "date": "Step Completed", "desc": "Citizen profile verified.",
     "status": "completed", "badge": "Verified", "icon": "CheckCircle2"},
    {"title": "Eligible Schemes Identification", "date": "Determined", "desc": "AI scanned matching schemes.",
     "status": "completed", "badge": "Ready", "icon": "Award"},
    {"title": "Required Documents Verification", "date": "Action Required", "desc": "Upload Income Certificate.",
     "status": "action_required", "badge": "Gap Found", "icon": "AlertCircle"},
    {"title": "Application Forms Submission", "date": "Upcoming Step", "desc": "Submit applications to proceed.",
     "status": "upcoming", "badge": "Locked", "icon": "Clock"},
    {"title": "Department Verification & Disbursal", "date": "Future Milestone",
     "desc": "Physical or virtual audit prior to grant.", "status": "pending", "badge": "Locked", "icon": "Lock"},
]


async def get_roadmap(uid: str) -> dict:
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("roadmaps").document(uid).get())
    
    if doc.exists:
        data = doc.to_dict() or {}
        data["id"] = doc.id
        items = data.get("items", [])
        
        completed = sum(1 for i in items if i.get("status") == "completed")
        actionRequired = sum(1 for i in items if i.get("status") in ["action_required", "actionRequired"])
        upcoming = sum(1 for i in items if i.get("status") == "upcoming")
        pending = sum(1 for i in items if i.get("status") == "pending")
        
        data["summary"] = {
            "completed": completed,
            "actionRequired": actionRequired,
            "upcoming": upcoming,
            "pending": pending,
        }
        if not items:
            data["message"] = "No roadmap items found for your profile."
            
        return {"roadmap": data}

    # Seed default roadmap if not exists
    now = datetime.utcnow().isoformat()
    completed = sum(1 for i in DEFAULT_ITEMS if i.get("status") == "completed")
    actionRequired = sum(1 for i in DEFAULT_ITEMS if i.get("status") in ["action_required", "actionRequired"])
    upcoming = sum(1 for i in DEFAULT_ITEMS if i.get("status") == "upcoming")
    pending = sum(1 for i in DEFAULT_ITEMS if i.get("status") == "pending")

    default = {
        "citizenId": uid,
        "items": DEFAULT_ITEMS,
        "createdAt": now,
        "updatedAt": now,
        "summary": {
            "completed": completed,
            "actionRequired": actionRequired,
            "upcoming": upcoming,
            "pending": pending,
        },
        "message": "Default roadmap initialized for citizen.",
    }
    await loop.run_in_executor(None, lambda: get_col("roadmaps").document(uid).set(default))
    default["id"] = uid
    return {"roadmap": default}
