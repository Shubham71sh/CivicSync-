"""
Scheme Notifications Router — /api/scheme-notifications
Profession-Based Government Scheme Notification System
"""

import asyncio
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query

from app.core.deps import get_current_user
from app.services import scheme_notification_service as svc

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/scheme-notifications", tags=["Scheme Notifications"])


# ── AI Recommendations ────────────────────────────────────────────────────────

@router.get("/recommendations")
async def get_recommendations(
    profession: Optional[str] = Query(None, description="Override profession (uses profile if omitted)"),
    state: Optional[str] = Query(None, description="Override state"),
    income: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Generate AI-powered scheme recommendations tailored to the user's profession.
    Falls back to profile data when query params are not supplied.
    """
    # Resolve profession / state from profile if not provided
    resolved_profession = profession or current_user.get("profession", "Citizen")
    resolved_state = state or current_user.get("location", "All India")
    resolved_income = income or current_user.get("income", "")

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            svc.get_profession_recommendations,
            current_user["_id"],
            resolved_profession,
            resolved_state,
            resolved_income,
        )
        return {"success": True, **result}
    except Exception as exc:
        logger.error(f"[SchemeNotifications] recommendations error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ── List Notifications ────────────────────────────────────────────────────────

@router.get("/")
async def list_notifications(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Return all scheme notification records for the authenticated user."""
    try:
        loop = asyncio.get_event_loop()
        notifications = await loop.run_in_executor(
            None, svc.get_notifications, current_user["_id"]
        )
        unread_count = sum(1 for n in notifications if not n.get("isRead"))
        return {
            "success": True,
            "notifications": notifications,
            "total": len(notifications),
            "unreadCount": unread_count,
        }
    except Exception as exc:
        logger.error(f"[SchemeNotifications] list error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ── Mark Read ─────────────────────────────────────────────────────────────────

@router.post("/mark-read/{notif_id}")
async def mark_read(
    notif_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    loop = asyncio.get_event_loop()
    ok = await loop.run_in_executor(None, svc.mark_read, current_user["_id"], notif_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"success": True, "message": "Marked as read."}


@router.post("/mark-all-read")
async def mark_all_read(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    loop = asyncio.get_event_loop()
    count = await loop.run_in_executor(None, svc.mark_all_read, current_user["_id"])
    return {"success": True, "markedCount": count}


# ── Preferences ───────────────────────────────────────────────────────────────

@router.get("/preferences")
async def get_preferences(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    loop = asyncio.get_event_loop()
    prefs = await loop.run_in_executor(None, svc.get_preferences, current_user["_id"])
    return {"success": True, "preferences": prefs}


@router.post("/preferences")
async def save_preferences(
    body: Dict[str, Any] = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    loop = asyncio.get_event_loop()
    saved = await loop.run_in_executor(
        None, svc.save_preferences, current_user["_id"], body
    )
    return {"success": True, "preferences": saved}
