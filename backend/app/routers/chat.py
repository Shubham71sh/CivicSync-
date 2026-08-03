from fastapi import APIRouter, Depends
from app.schemas.chat import ChatRequest
from app.services.chat_service import process_chat
from app.core.deps import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/")
async def chat(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    result = process_chat(body.message, body.language)
    return {"success": True, **result}
