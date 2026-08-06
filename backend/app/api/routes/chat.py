from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.config.database import get_db
from app.middleware.auth import get_current_user

from app.schemas.chat_schema import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ChatMessageResponse,
    ConversationResponse,
    ConversationListResponse,
    NewConversationRequest
)

from app.services.chat_services import ChatService
from app.services.memory_service import MemoryService

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat"]
)
@router.post("/conversation")
async def create_new_chat(
    data: NewConversationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):

    db = get_db()

    memory = MemoryService(db)

    conversation = await memory.create_conversation(
        current_user["_id"],
        data.title
    )

    return {
        "conversation_id": conversation["_id"],
        "title": conversation["title"]
    }
@router.get(
    "/conversations",
    response_model=ConversationListResponse
)
async def get_conversations(
    current_user: Dict[str, Any] = Depends(get_current_user)
):

    db = get_db()

    memory = MemoryService(db)

    conversations = await memory.get_all_conversations(
        current_user["_id"]
    )

    return ConversationListResponse(
        conversations=[
            ConversationResponse(
                id=str(c["_id"]),
                title=c["title"],
                created_at=c["createdAt"],
                updated_at=c["updatedAt"]
            )
            for c in conversations
        ]
    )
@router.delete("/conversation/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):

    db = get_db()

    memory = MemoryService(db)

    await memory.delete_conversation(
        conversation_id
    )

    return {
        "success": True
    }
@router.post("/", response_model=ChatResponse)
@router.post("", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    print("========== CHAT ROUTE HIT ==========")

    try:

        db = get_db()

        chat_service = ChatService(db)

        language_map = {
            "en": "English",
            "hi": "Hindi",
            "pa": "Punjabi",
            "bn": "Bengali",
            "te": "Telugu",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "zh": "Chinese",
            "ar": "Arabic"
        }

        language = language_map.get(
            data.language,
            "English"
        )

        result = await chat_service.chat(

            user_id=current_user["_id"],

            question=data.message,

            language=language,

            conversation_id=data.conversation_id,

            current_user=current_user,

        )

        return ChatResponse(

            response=result["response"],

            conversation_id=result["conversation_id"],

            sources=result["sources"]

        )

    except Exception as e:

        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=str(e)

        )
    # --------------------------------------------------
# Get Conversation History
# --------------------------------------------------

@router.get(
    "/history/{conversation_id}",
    response_model=ChatHistoryResponse
)
async def get_chat_history(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):

    try:

        db = get_db()

        memory = MemoryService(db)

        messages = await memory.get_messages(
            conversation_id
        )

        history = []

        for msg in messages:

            history.append(

                ChatMessageResponse(

                    id=str(msg["_id"]),

                    conversation_id=msg["conversationId"],

                    type=msg["type"],

                    text=msg["text"],

                    timestamp=msg["timestamp"]

                )

            )

        return ChatHistoryResponse(

            conversation_id=conversation_id,

            history=history

        )

    except Exception as e:

        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=str(e)

        )


# --------------------------------------------------
# Clear One Conversation
# --------------------------------------------------

@router.delete("/history/{conversation_id}")
async def clear_conversation_history(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):

    try:

        db = get_db()

        memory = MemoryService(db)

        await memory.delete_messages(
            conversation_id
        )

        return {

            "success": True,

            "message": "Conversation cleared."

        }

    except Exception as e:

        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=str(e)

        )


# --------------------------------------------------
# Clear All Conversations
# --------------------------------------------------

@router.delete("/history")
async def clear_all_history(
    current_user: Dict[str, Any] = Depends(get_current_user)
):

    try:

        db = get_db()

        memory = MemoryService(db)

        await memory.clear_all_conversations(
            current_user["_id"]
        )

        return {

            "success": True,

            "message": "All conversations deleted."

        }

    except Exception as e:

        raise HTTPException(

            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=str(e)

        )
