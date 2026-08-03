from fastapi import APIRouter, Depends
from app.services import citizen_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    result = await citizen_service.get_dashboard_stats(current_user["uid"])
    return {"success": True, **result}
