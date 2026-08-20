"""
Fake News Service
Verifies citizen claims against official indexed government documents in Qdrant.
Produces verdicts: TRUE, FALSE, MISLEADING, or UNVERIFIED.
"""

import json
import logging
from typing import Dict, Any, Optional

from app.ai.orchestrator import orchestrator
from app.ai.retrieval.retrieval_service import get_retrieval_service
from app.ai.rag.citation_service import CitationService

logger = logging.getLogger(__name__)


async def verify_claim_with_ai(
    text: str,
    url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Verify a claim against official indexed sources using vector RAG + AIOrchestrator.
    """
    logger.info(f"[FakeNews] Verifying claim: '{text[:100]}'")

    # Step 1: Retrieve official evidence from Qdrant
    retrieval_service = get_retrieval_service()
    
    # Search across bills, laws, government schemes, and policies
    retrieval_result = None
    try:
        retrieval_result = await retrieval_service.retrieve(
            query=text,
            top_k=5,
            min_score=0.35
        )
    except Exception as e:
        logger.error(f"[FakeNews] Retrieval failed: {e}")

    # Reconstruct retrieved evidence
    evidence = ""
    sources = []
    if retrieval_result and retrieval_result.chunks:
        evidence = "\n\n".join([f"EVIDENCE: {c.text}" for c in retrieval_result.chunks])
        sources = CitationService.format_sources_as_strings(retrieval_result.chunks)
        confidence = retrieval_result.confidence
        logger.info(f"[FakeNews] Retrieved {len(retrieval_result.chunks)} evidence chunks.")
    else:
        # If no evidence was retrieved, we MUST mark as UNVERIFIED
        logger.info("[FakeNews] No official evidence chunks found. Returning UNVERIFIED.")
        return {
            "claim": text,
            "url": url,
            "verified": False,
            "confidence": 0.0,
            "analysis": "I could not find enough reliable official evidence in the uploaded government documents to verify this claim.",
            "sources": [],
            "status": "completed",
            "verdict": "UNVERIFIED"
        }

    # Step 2: Build the grounded fact-check prompt
    prompt = f"""
You are an expert fact-checking AI for a public transparency platform.
Analyze the following claim against the official government evidence retrieved.

Claim: {text}
Reference URL: {url if url else "Not Provided"}

Retrieved Government Evidence:
{evidence}

YOUR TASK:
Determine if the claim is TRUE, FALSE, MISLEADING, or UNVERIFIED based strictly on the retrieved evidence.
If there is no direct evidence supporting or refuting the claim, the verdict MUST be UNVERIFIED.

Return ONLY valid JSON in this format:
{{
    "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED",
    "confidence": 0.90,
    "analysis": "Detail why this verdict was reached, citing specific sections/documents from the retrieved evidence. Keep it concise."
}}
"""

    verdict_data = None
    try:
        # Call the Orchestrator to generate JSON verdict
        verdict_data = orchestrator.generate_json(prompt, provider="gemini")
    except Exception as e:
        logger.error(f"[FakeNews] AI verification failed: {e}")

    if not verdict_data or not isinstance(verdict_data, dict):
        logger.warning("[FakeNews] AI failed to return valid JSON fact-check. Using mock.")
        return get_mock_fact_check(text, url)

    verdict = verdict_data.get("verdict", "UNVERIFIED").upper()
    verified = (verdict == "TRUE")

    return {
        "claim": text,
        "url": url,
        "verified": verified,
        "confidence": float(verdict_data.get("confidence", confidence)),
        "analysis": verdict_data.get("analysis", "No analysis provided."),
        "sources": sources,
        "status": "completed",
        "verdict": verdict
    }


def get_mock_fact_check(
    text: str,
    url: Optional[str] = None
) -> Dict[str, Any]:
    text_lower = text.lower()
    suspicious_words = ["fake", "fraud", "scam", "conspiracy", "hoax"]
    is_suspicious = any(word in text_lower for word in suspicious_words)

    verdict = "FALSE" if is_suspicious else "UNVERIFIED"
    analysis = (
        "This claim cannot be verified against official records. Heuristic check suggests "
        "potential misinformation based on suspicious vocabulary." if is_suspicious else
        "No official government records matching this claim were found in the database to support verification."
    )

    return {
        "claim": text,
        "url": url,
        "verified": False,
        "confidence": 0.5,
        "analysis": analysis,
        "sources": ["Local Heuristics Verification"],
        "status": "fallback",
        "verdict": verdict
    }