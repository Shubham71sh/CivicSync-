from fastapi import APIRouter, Depends
from app.schemas.benefits import (
    ApplyBenefitRequest, UpdateBenefitStatusRequest, CheckEligibilityRequest
)
from app.services import scheme_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/benefits", tags=["Benefits"])


@router.get("/recommended")
async def get_recommended(current_user: dict = Depends(get_current_user)):
    result = await scheme_service.get_recommended(current_user["uid"])
    return {"success": True, **result}


@router.post("/apply")
async def apply_for_benefit(
    body: ApplyBenefitRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await scheme_service.apply_for_benefit(
        current_user["uid"], body.schemeId, body.schemeName or "", body.notes or ""
    )
    return {"success": True, **result}


@router.post("/check")
async def check_eligibility(
    body: CheckEligibilityRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await scheme_service.check_eligibility(
    current_user["uid"],
    body.schemeId,
    body.damagePercent
)
    return {"success": True, **result}


@router.get("/")
async def get_user_benefits(current_user: dict = Depends(get_current_user)):
    result = await scheme_service.get_user_benefits(current_user["uid"])
    return {"success": True, **result}


@router.get("/{benefit_id}")
async def get_benefit_by_id(
    benefit_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = await scheme_service.get_benefit_by_id(current_user["uid"], benefit_id)
    return {"success": True, **result}


@router.put("/{benefit_id}/status")
async def update_benefit_status(
    benefit_id: str,
    body: UpdateBenefitStatusRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await scheme_service.update_benefit_status(
        current_user["uid"], benefit_id, body.status
    )
    return {"success": True, **result}
