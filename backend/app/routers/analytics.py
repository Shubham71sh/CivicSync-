from fastapi import APIRouter, Depends
from app.services import analytics_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    result = await analytics_service.get_analytics(current_user["uid"])
    return {"success": True, **result}
