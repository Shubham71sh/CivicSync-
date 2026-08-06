from pydantic import BaseModel, Field
from typing import List, Optional


class TranslationRequest(BaseModel):
    bill_id: str = Field(..., description="ID of the bill document in Firestore")
    target_language: str = Field("hi", description="Target language code or name (e.g., hi, Hindi, bn, ta, te, pa)")


class TranslationResponse(BaseModel):
    language: str = Field(..., description="Full display name of target language (e.g., Hindi)")
    translated_summary: str = Field(..., description="Translated bill summary text")
    cached: Optional[bool] = Field(False, description="Whether translation was retrieved from Firestore cache")


class LanguagesResponse(BaseModel):
    languages: List[str]
