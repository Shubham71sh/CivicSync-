# pyrefly: ignore [missing-import]
from google import genai
from app.config.settings import settings
import logging

logger = logging.getLogger("uvicorn.error")
_client = None

def get_gemini_client():
    global _client
    if _client is None:
        if settings.GEMINI_API_KEY:
            try:
                # We use the new google-genai SDK as specified in main.py and requirements.txt
                _client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Gemini Client initialized successfully using google-genai SDK.")
            except Exception as e:
                logger.error(f"Error initializing Gemini client: {e}")
        else:
            logger.warning("GEMINI_API_KEY is not configured in environment variables. AI operations may fail or run in fallback mock mode.")
    return _client
