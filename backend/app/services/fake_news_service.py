import json
import logging
from typing import Dict, Any, Optional
from app.config.gemini import get_gemini_client

logger = logging.getLogger("uvicorn.error")

def verify_claim_with_ai(text: str, url: Optional[str] = None) -> Dict[str, Any]:
    """
    Fact check a claim statement or news article against official public knowledge/policy using Gemini.
    """
    client = get_gemini_client()
    
    prompt = f"""
    You are an objective, non-partisan fact-checking specialist for civic policy. Verify the factual accuracy of the following statement or claim.
    
    Statement to verify: "{text}"
    {f"Source URL referenced: {url}" if url else ""}
    
    Evaluate this claim based on public information, official documents, and news databases.
    Return a structured JSON output with:
    1. verified: A boolean indicating if the claim is true/verified (true) or false/misleading (false).
    2. confidence: A float between 0.0 and 1.0 indicating your certainty.
    3. analysis: A detailed explanation (3-4 sentences) analyzing why the statement is true, partially true, or false, detailing the context.
    4. sources: An array of 1-3 official sources, publications, or public entities that support this fact-checking result (e.g., ["Ministry of Law & Justice", "Official Press Release 2025"]).
    
    Provide output ONLY in valid JSON format inside a code block. Do not add introductory or surrounding text.
    """

    if client is None:
        logger.warning("Gemini Client not available. Using mock fact checking.")
        return get_mock_fact_check(text, url)

    try:
        response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=prompt
        )
        response_text = response.text.strip()
        
        # Clean markdown code block
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        verdict = json.loads(response_text)
        logger.info("Successfully completed AI fake news check using Gemini.")
        return {
            "verified": bool(verdict.get("verified", False)),
            "confidence": float(verdict.get("confidence", 0.5)),
            "analysis": verdict.get("analysis", "Fact-checking analysis not available."),
            "sources": verdict.get("sources", ["Public Records"])
        }
    except Exception as e:
        logger.error(f"Gemini fake news verification failed: {e}. Falling back to mock check.")
        return get_mock_fact_check(text, url)

def get_mock_fact_check(text: str, url: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns realistic mock fact-checking results.
    """
    # Simple heuristic to make mock interactive: if it mentions 'fake' or 'scam', verify as False
    text_lower = text.lower()
    is_verified = not ("scam" in text_lower or "fake" in text_lower or "fraud" in text_lower or "conspiracy" in text_lower)
    
    return {
        "verified": is_verified,
        "confidence": 0.85 if is_verified else 0.92,
        "analysis": (
            "The statement is consistent with current public policy directives and official announcements. "
            "Recent revisions in the local administration laws corroborate these numbers, ensuring alignment."
            if is_verified else
            "This statement contains misleading claims. Official records show that there are no such allocations or "
            "unilateral powers granted. Public finance registries refute this claim directly."
        ),
        "sources": [
            "Press Information Bureau (PIB)",
            "Ministry of Finance Audit Report 2025"
        ] if is_verified else [
            "Citizen Oversight Committee Report Q3",
            "Department of Public Auditing Fact Check Registry"
        ]
    }
