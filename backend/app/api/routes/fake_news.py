from fastapi import APIRouter, Depends
from app.schemas.bill_schema import FakeNewsRequest, FakeNewsResponse
from app.api.controllers.fake_news_controller import FakeNewsController
from app.middleware.auth import get_current_user
from typing import Dict, Any

router = APIRouter(
    prefix="/fake-news",
    tags=["Fake News"]
)

@router.post("", response_model=FakeNewsResponse)
async def check_fake_news(
    req: FakeNewsRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Validate a claim statement or reference URL for factual authenticity using AI fact-checking databases.
    """
    return await FakeNewsController.verify_claim_flow(req.text, req.url)
