import logging
from fastapi import HTTPException, status
from app.config.database import get_col
from app.services.gemini_client import call_gemini
from app.utils.language_config import SUPPORTED_LANGUAGES, normalize_language

logger = logging.getLogger("uvicorn.error")


class TranslationService:
    @staticmethod
    async def translate_bill_summary(bill_id: str, target_language: str) -> dict:
        """
        Translate a structured bill summary into target_language using Firestore caching + Gemini AI.
        Checks Firestore bill document for existing translation. If present and complete, returns cached translation.
        Otherwise generates translation using Gemini and caches the complete translated text in Firestore.
        """
        lang_code, lang_name = normalize_language(target_language)

        # 1. Fetch bill document from Firestore
        try:
            doc_ref = get_col("bills").document(bill_id)
            doc = doc_ref.get()
        except Exception as e:
            logger.error(f"[TranslationService] Firestore fetch error for bill '{bill_id}': {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {str(e)}"
            )

        if not doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bill with ID '{bill_id}' not found."
            )

        bill_data = doc.to_dict() or {}
        english_summary = bill_data.get("summary") or bill_data.get("extractedText", "")

        # 2. English requested -> return original summary directly
        if lang_code == "en":
            return {
                "language": "English",
                "translated_summary": english_summary,
                "cached": True,
            }

        # 3. Check Firestore cache inside existing bill document (under 'translations' map)
        translations = bill_data.get("translations") or {}
        cached_translation = translations.get(lang_code)

        # Ensure cached translation is non-empty and contains complete sections
        if (
            cached_translation 
            and isinstance(cached_translation, str) 
            and cached_translation.strip()
            and ("1. " in cached_translation or "১. " in cached_translation or "1." in cached_translation or len(english_summary) < 200)
        ):
            logger.info(f"[TranslationService] Cache hit for bill '{bill_id}' in '{lang_name}' ({lang_code}).")
            return {
                "language": lang_name,
                "translated_summary": cached_translation,
                "cached": True,
            }

        # 4. Generate translation via Gemini if not cached or if old cache was incomplete
        if not english_summary:
            return {
                "language": lang_name,
                "translated_summary": "No summary text available to translate.",
                "cached": False,
            }

        prompt = f"""You are an expert civic translator. Translate the following structured government bill summary into {lang_name}.

CRITICAL TRANSLATION DIRECTIVES:
1. TRANSLATE THE COMPLETE DOCUMENT: Translate every single word, section, heading, paragraph, and bullet point from start to finish. Do NOT shorten, condense, summarize, or omit any part of the text.
2. PRESERVE ALL 8 STRUCTURED SECTIONS: You MUST retain all 8 section headings exactly as structured in the source document:
   - 📌 1. Overview
   - 🎯 2. Objectives
   - 📜 3. Key Provisions
   - 👥 4. Citizen Impact
   - 🌟 5. Benefits
   - ⚠️ 6. Challenges
   - 🔄 7. Important Changes
   - 💡 8. Key Takeaways
3. PRESERVE ALL FORMATTING: Retain all emojis, section numbers, section titles, line breaks, spacing, bullet points (•), and Markdown structure. Do NOT remove bullet symbols or line spacing.
4. ACCURATE TRANSLATION ONLY: Do NOT re-summarize or generate new content. Translate the exact information provided into clear, natural, citizen-friendly {lang_name}.
5. NO WRAPPER TEXT: Do NOT add any introductory notes, preambles, or closing remarks. Return ONLY the complete translated document.

Document to translate:
\"\"\"
{english_summary}
\"\"\"
"""

        try:
            translated_text = call_gemini(prompt).strip()
            if not translated_text:
                raise ValueError("AI translation returned empty content.")

            # 5. Store complete translation into Firestore bill document under translations.{lang_code}
            translations[lang_code] = translated_text
            doc_ref.set({"translations": translations}, merge=True)
            logger.info(f"[TranslationService] Generated & cached complete translation for bill '{bill_id}' in '{lang_name}'.")

            return {
                "language": lang_name,
                "translated_summary": translated_text,
                "cached": False,
            }
        except Exception as e:
            logger.error(f"[TranslationService] Translation error for bill '{bill_id}' in '{lang_name}': {e}", exc_info=True)
            # Fallback requirement: If translation fails, return English summary cleanly
            return {
                "language": lang_name,
                "translated_summary": english_summary,
                "cached": False,
                "error": f"Translation to {lang_name} temporarily unavailable. Displaying original English summary."
            }

