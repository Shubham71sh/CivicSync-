import json
import logging
from typing import Dict, Any, Optional

from app.config.gemini import get_gemini_client

logger = logging.getLogger(__name__)


async def verify_claim_with_ai(
    text: str,
    url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Verify a claim using Gemini AI.
    """

    client = get_gemini_client()

    if client is None:
        logger.warning("Gemini client not available. Using mock fact check.")
        return get_mock_fact_check(text, url)

    prompt = f"""
You are an expert fact-checking AI.

Analyze the following claim and determine whether it appears credible.

Return ONLY valid JSON in this format:

{{
    "verified": true,
    "confidence": 0.92,
    "analysis": "Short explanation",
    "sources": [
        "Official Government Website",
        "Press Information Bureau"
    ]
}}

Claim:
{text}

Reference URL:
{url if url else "Not Provided"}
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=prompt
        )

        response_text = response.text.strip()

        if response_text.startswith("```json"):
            response_text = response_text[7:]

        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        verdict = json.loads(response_text)

        return {
            "claim": text,
            "url": url,
            "verified": bool(verdict.get("verified", False)),
            "confidence": float(verdict.get("confidence", 0.5)),
            "analysis": verdict.get(
                "analysis",
                "No analysis returned."
            ),
            "sources": verdict.get(
                "sources",
                []
            ),
            "status": "completed"
        }

    except Exception as e:
        logger.error(f"Gemini verification failed: {e}")

        return get_mock_fact_check(text, url)


def get_mock_fact_check(
    text: str,
    url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fallback fact checker.
    """

    text_lower = text.lower()

    suspicious_words = [
        "fake",
        "fraud",
        "scam",
        "conspiracy",
        "hoax"
    ]

    verified = not any(word in text_lower for word in suspicious_words)

    confidence = 0.82 if verified else 0.33

    return {
        "claim": text,
        "url": url,
        "verified": verified,
        "confidence": confidence,
        "analysis": (
            "No Gemini response available. This is a heuristic result."
        ),
        "sources": [
            "Mock Verification"
        ],
        "status": "fallback"
    }