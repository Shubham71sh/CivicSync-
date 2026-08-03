from fastapi import APIRouter, Depends
from app.schemas.citizen import UpdateProfileRequest
from app.services import citizen_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/citizen", tags=["Citizen"])


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    result = await citizen_service.get_profile(current_user["uid"])
    return {"success": True, **result}


@router.put("/profile")
async def update_profile(
    body: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await citizen_service.update_profile(current_user["uid"], body.model_dump())
    return {"success": True, "message": "Profile updated successfully.", **result}


@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    result = await citizen_service.get_dashboard_stats(current_user["uid"])
    return {"success": True, **result}
