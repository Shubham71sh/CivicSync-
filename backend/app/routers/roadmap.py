from fastapi import APIRouter, Depends
from app.services import roadmap_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


@router.get("/")
async def get_roadmap(current_user: dict = Depends(get_current_user)):
    result = await roadmap_service.get_roadmap(current_user["uid"])
    return {"success": True, **result}


@router.get("/{citizen_id}")
async def get_roadmap_by_citizen(
    citizen_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = await roadmap_service.get_roadmap(citizen_id)
    return {"success": True, **result}
