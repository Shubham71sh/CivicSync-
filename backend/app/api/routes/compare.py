from fastapi import APIRouter, Depends
from app.schemas.bill_schema import CompareRequest, CompareResponse
from app.api.controllers.compare_controller import CompareController
from app.middleware.auth import get_current_user
from typing import Dict, Any

router = APIRouter(
    prefix="/bills/compare",
    tags=["Compare"]
)

@router.post("", response_model=CompareResponse)
async def compare_bills(
    req: CompareRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Compare two or more bills side-by-side highlighting their differences and similarities.
    """
    return await CompareController.compare_bills_flow(req.billIds)
