from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    message: str
    language: str = "en-US"


class ChatResponse(BaseModel):
    success: bool = True
    response: str
    sources: List[str] = []
