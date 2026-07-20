from fastapi import APIRouter, Depends
from app.schemas.benefits import CheckEligibilityRequest
from app.services import scheme_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/eligibility", tags=["Eligibility"])


@router.post("/check")
async def check_eligibility(
    body: CheckEligibilityRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await scheme_service.check_eligibility(current_user["uid"], body.schemeId)
    return {"success": True, **result}
