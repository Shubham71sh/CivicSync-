"""
Dashboard router — serves all Overview Dashboard endpoints.
Provides consolidated and individual card data for the CivicSync frontend.
"""

from fastapi import APIRouter, Depends
from app.services import citizen_service, dashboard_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Legacy endpoint — returns general dashboard stats."""
    result = await citizen_service.get_dashboard_stats(current_user["uid"])
    return {"success": True, **result}


@router.get("/overview")
async def get_dashboard_overview(current_user: dict = Depends(get_current_user)):
    """
    Consolidated single-call endpoint for the Overview Dashboard.
    Returns stats, activity feed, eligibility, GPS summary, and impact data.
    Does NOT include bills count (fetched from /bills endpoint on frontend).
    """
    result = await dashboard_service.get_dashboard_overview(current_user["uid"])
    return {"success": True, **result}


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Stats cards: schemes count, deadlines, corruption alerts, unclaimed benefits."""
    result = await dashboard_service.get_dashboard_overview(current_user["uid"])
    return {"success": True, "stats": result.get("stats", {})}


@router.get("/activity")
async def get_dashboard_activity(current_user: dict = Depends(get_current_user)):
    """Live Pulse Feed — real activity feed sorted by newest first."""
    result = await dashboard_service.get_activity_feed(current_user["uid"])
    return {"success": True, **result}


@router.get("/eligibility")
async def get_dashboard_eligibility(current_user: dict = Depends(get_current_user)):
    """Top 2 eligible schemes with match scores for the Status & Eligibility card."""
    result = await dashboard_service.get_eligibility_summary(current_user["uid"])
    return {"success": True, **result}


@router.get("/gps")
async def get_dashboard_gps(current_user: dict = Depends(get_current_user)):
    """Roadmap progress summary for the Civic GPS card."""
    result = await dashboard_service.get_gps_summary(current_user["uid"])
    return {"success": True, "gps": result}
