from fastapi import APIRouter, Depends, Query
from app.services import notification_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def get_notifications(
    unreadOnly: bool = Query(False),
    current_user: dict = Depends(get_current_user),
):
    result = await notification_service.get_notifications(
        current_user["uid"], unread_only=unreadOnly
    )
    return {"success": True, **result}


@router.post("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    result = await notification_service.mark_all_read(current_user["uid"])
    return {"success": True, **result}


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = await notification_service.mark_read(notification_id, current_user["uid"])
    return {"success": True, **result}
