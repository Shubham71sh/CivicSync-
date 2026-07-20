from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# -----------------------------
# Request Models
# -----------------------------

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    conversation_id: Optional[str] = None


class NewConversationRequest(BaseModel):
    title: Optional[str] = "New Chat"


# -----------------------------
# Message Models
# -----------------------------

class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    type: str
    text: str
    timestamp: datetime


# -----------------------------
# Conversation Models
# -----------------------------

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]


# -----------------------------
# History
# -----------------------------

class ChatHistoryResponse(BaseModel):
    conversation_id: str
    history: List[ChatMessageResponse]


# -----------------------------
# Chat Response
# -----------------------------

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: List[str] = []