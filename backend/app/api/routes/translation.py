from fastapi import APIRouter, HTTPException, status
from app.schemas.translation_schema import TranslationRequest, TranslationResponse
from app.services.translation_service import TranslationService
from app.utils.language_config import SUPPORTED_LANGUAGES

router = APIRouter(
    prefix="/translation",
    tags=["Multilingual Translation"]
)


@router.get("/languages")
async def get_supported_languages():
    """
    Returns list of supported languages for Multilingual Bill Intelligence.
    • English
    • Hindi
    • Bengali
    • Tamil
    • Telugu
    • Punjabi
    """
    return list(SUPPORTED_LANGUAGES.values())


@router.post("/translate", response_model=TranslationResponse)
async def translate_bill(req: TranslationRequest):
    """
    Translate a bill summary into target_language.
    Checks Firestore cache before calling Gemini.
    """
    result = await TranslationService.translate_bill_summary(
        bill_id=req.bill_id,
        target_language=req.target_language
    )
    return TranslationResponse(
        language=result.get("language", "English"),
        translated_summary=result.get("translated_summary", ""),
        cached=result.get("cached", False)
    )
