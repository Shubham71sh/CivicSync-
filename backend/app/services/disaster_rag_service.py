"""
Disaster Relief RAG Service — isolated from the existing AI Chat RAGService.

Retrieves relevant chunks from the `disaster_relief_knowledge` Firestore
collection (Disaster Relief-specific, never touches government_documents/bills/schemes
used by the AI Chat module).

Sends retrieved context to the Groq API (via call_gemini()) and returns
a structured, sourced response for Steps 5–8.
"""

import os
import re
import json
import asyncio
import logging
from collections import Counter
from typing import Any, Dict, List, Optional
from google import genai

from app.config.database import get_col
from app.services.gemini_client import call_gemini

logger = logging.getLogger("uvicorn.error")

def _call_llm(prompt: str) -> str:
    """Helper to generate content using Gemini SDK if key is set, else fall back to call_gemini (Groq)."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception as exc:
            logger.warning(f"[DisasterRAG] Gemini API call failed: {exc}, trying Groq fallback")
    return call_gemini(prompt)

# ── Firestore collection name (Disaster Relief-specific, never shared) ─────────
DR_KNOWLEDGE_COL = "disaster_relief_knowledge"

# ── Stop words for keyword matching ────────────────────────────────────────────
STOPWORDS = {
    "what", "is", "the", "of", "to", "and", "a", "an", "in", "on",
    "for", "about", "tell", "me", "please", "how", "can", "i", "my",
    "do", "does", "with", "under", "from", "am", "are", "be", "this",
    "that", "it", "as", "at", "by", "or", "all",
}

# ── Disaster type alias mapping ────────────────────────────────────────────────
# Heavy Rain: frontend sends "rain" (Step1DisasterSelect id="rain").
# Seed chunks are stored under disaster="heavy_rain" (HEAVYRAIN-* docs).
# We map all heavy-rain variants -> "heavy_rain" so the Firestore filter matches.
DISASTER_ALIASES = {
    # Heavy Rain variants sent by the frontend
    "rain": "heavy_rain",
    "heavyrain": "heavy_rain",
    "heavy rain": "heavy_rain",
    "heavy_rain": "heavy_rain",
    "cloudburst": "heavy_rain",
    "urban flood": "heavy_rain",
    "urban_flood": "heavy_rain",
    # Canonical aliases for other disasters (kept for safety)
    "flood": "flood",
    "fire": "fire",
    "earthquake": "earthquake",
    "landslide": "landslide",
    "cyclone": "cyclone",
}


def _normalize_disaster(disaster_type: str) -> str:
    """Normalize disaster type string to canonical form used in knowledge base."""
    raw = (disaster_type or "").lower().strip()
    # Replace spaces and dashes with underscores for consistent lookup
    normalized = raw.replace(" ", "_").replace("-", "_")
    # Check alias map first (using the space-normalized raw key)
    return DISASTER_ALIASES.get(raw, DISASTER_ALIASES.get(normalized, normalized))


def _tokens(text: Any) -> List[str]:
    return re.findall(r"\b[\w-]+\b", str(text or "").lower())


def _keywords(text: Any) -> List[str]:
    return [w for w in _tokens(text) if w not in STOPWORDS and len(w) > 2]


def _chunk_text(chunk: Dict[str, Any]) -> str:
    """Concatenate all text fields of a knowledge chunk for scoring."""
    parts = [
        chunk.get("title", ""),
        chunk.get("content", ""),
        chunk.get("disaster", ""),
        chunk.get("category", ""),
        chunk.get("source_authority", ""),
        chunk.get("document_name", ""),
    ]
    tags = chunk.get("tags", [])
    if isinstance(tags, list):
        parts.extend(tags)
    return " ".join(str(p) for p in parts if p)


def _score_chunk(
    chunk: Dict[str, Any],
    disaster_norm: str,
    category: str,
    focus_keywords: List[str],
) -> float:
    """Score a knowledge chunk for relevance."""
    text = _chunk_text(chunk)
    doc_terms = Counter(_tokens(text))

    # Keyword match score
    kw_score = sum(min(doc_terms[w], 3) for w in focus_keywords)

    # Disaster type exact match bonus
    chunk_disaster = (chunk.get("disaster") or "").lower().replace(" ", "_")
    if chunk_disaster == disaster_norm:
        disaster_bonus = 8
    elif disaster_norm == "heavy_rain" and chunk_disaster == "flood":
        disaster_bonus = 6
    else:
        disaster_bonus = 0

    # Category match bonus
    chunk_cat = (chunk.get("category") or "").lower()
    cat_bonus = 6 if chunk_cat == category else 0

    # Verified source bonus
    verified_bonus = 2 if chunk.get("verified") else 0

    return kw_score + disaster_bonus + cat_bonus + verified_bonus


async def retrieve_disaster_chunks(
    disaster_type: str,
    category: str,
    damage_info: Optional[str] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Retrieve the most relevant knowledge chunks for a given disaster type
    and category (schemes | eligibility | documents | timeline).

    Returns chunks sorted by relevance score, deduplicated by id.
    Returns empty list if collection is empty or Firestore is unavailable.
    """
    disaster_norm = _normalize_disaster(disaster_type)
    focus_text = f"{disaster_type} {category} {damage_info or ''}"
    focus_keywords = _keywords(focus_text)

    loop = asyncio.get_event_loop()

    def _fetch():
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter  # noqa: PLC0415
            col = get_col(DR_KNOWLEDGE_COL)
            if disaster_norm == "heavy_rain":
                # Heavy Rain mapping to both heavy rain and flood chunks
                docs = list(
                    col.where(filter=FieldFilter("disaster", "in", ["heavy_rain", "flood"]))
                       .where(filter=FieldFilter("category", "==", category))
                       .limit(50)
                       .stream()
                )
            else:
                docs = list(
                    col.where(filter=FieldFilter("disaster", "==", disaster_norm))
                       .where(filter=FieldFilter("category", "==", category))
                       .limit(50)
                       .stream()
                )
            # Fallback: fetch all for this disaster if category filter returns nothing
            if not docs:
                if disaster_norm == "heavy_rain":
                    docs = list(
                        col.where(filter=FieldFilter("disaster", "in", ["heavy_rain", "flood"]))
                           .limit(80)
                           .stream()
                    )
                else:
                    docs = list(
                        col.where(filter=FieldFilter("disaster", "==", disaster_norm))
                           .limit(80)
                           .stream()
                    )
            # Broader fallback: any relevant doc
            if not docs:
                docs = list(col.limit(100).stream())
            return docs
        except Exception as exc:
            logger.warning(f"[DisasterRAG] Firestore fetch failed: {exc}")
            return []

    raw_docs = await loop.run_in_executor(None, _fetch)

    chunks = []
    seen_ids = set()
    for snap in raw_docs:
        ch = snap.to_dict() or {}
        ch["_doc_id"] = snap.id
        score = _score_chunk(ch, disaster_norm, category, focus_keywords)
        if score > 0 and snap.id not in seen_ids:
            ch["_score"] = score
            chunks.append(ch)
            seen_ids.add(snap.id)

    chunks.sort(key=lambda c: c["_score"], reverse=True)
    return chunks[:limit]


def _build_prompt(
    step: str,
    disaster_type: str,
    damage_info: str,
    context_chunks: List[Dict[str, Any]],
) -> str:
    """Build a grounded prompt from retrieved knowledge chunks."""

    # Format context
    ctx_parts = []
    for i, ch in enumerate(context_chunks, 1):
        src = ch.get("source_authority", "Government of India")
        doc = ch.get("document_name", "")
        date = ch.get("document_date", "")
        url = ch.get("source_url", "")
        content = ch.get("content", "")
        title = ch.get("title", "")

        ctx_parts.append(
            f"[SOURCE {i}]\n"
            f"Title: {title}\n"
            f"Authority: {src}\n"
            f"Document: {doc} ({date})\n"
            f"URL: {url}\n"
            f"Content:\n{content}\n"
        )

    context_text = "\n---\n".join(ctx_parts) if ctx_parts else "No verified government sources found."

    step_instructions = {
        "schemes": (
            "List the relevant government relief schemes/assistance norms applicable to this disaster. "
            "For each scheme provide: scheme name, applicable disaster, short explanation, why it is relevant, "
            "eligibility summary, source authority, document name, verification status (verified/unverified), "
            "official source URL, relief amount (e.g. '₹95,100 per household' or '₹6,800 per hectare'), "
            "processing days (e.g. 7 or 10 as an integer), min damage percentage (integer), max damage percentage (integer), "
            "benefits (list of strings), and required documents (list of strings). "
            "Return a JSON array under key 'schemes'. Each item: "
            "{name, applicable_disaster, explanation, relevance, eligibility_summary, "
            "source_authority, document_name, verified, source_url, relief_amount, "
            "processing_days, min_damage, max_damage, benefits, required_documents}. "
            "If no verified source found, return {error: 'No verified government information found for this disaster type.'}."
        ),
        "eligibility": (
            "Based ONLY on the government sources provided, explain eligibility for disaster relief. "
            "Return JSON with: {status (one of: 'Eligible', 'Possibly Eligible', 'Not Enough Information'), "
            "conditions_matched (list of strings), conditions_pending (list of strings), "
            "explanation (plain language, 2-3 sentences), "
            "disclaimer 'Final eligibility is determined by the concerned authority — this is informational only.', "
            "source_authority, document_name, source_url}. "
            "Never fabricate eligibility rules. Use only information from the provided sources."
        ),
        "documents": (
            "List all documents required for disaster relief application based on the government sources provided. "
            "Return JSON: {documents: [{name, why_required, mandatory (true/false), conditional_note, source_authority, document_name}], "
            "source_authority, document_name, source_url}. "
            "Only list documents explicitly mentioned in the sources. Do not invent documents."
        ),
        "timeline": (
            "Based on the government sources provided, explain the official relief claim process timeline. "
            "Return JSON: {stages: [{step_number, stage_name, description, authority, typical_duration}], "
            "total_process_note, source_authority, document_name, source_url}. "
            "Do not invent processing times. If official timeline is not in the sources, state that clearly."
        ),
    }

    instruction = step_instructions.get(step, step_instructions["schemes"])

    prompt = f"""You are a government information assistant for the CivicSync Disaster Relief system.
You MUST only use the information provided in the government sources below. Do NOT use general knowledge.
If the sources do not contain the answer, say so explicitly.

DISASTER TYPE: {disaster_type}
DAMAGE INFORMATION: {damage_info}
STEP: {step.upper()}

VERIFIED GOVERNMENT SOURCES:
{context_text}

TASK: {instruction}

Return ONLY valid JSON. No markdown, no explanation outside JSON.
"""
    return prompt


def _safe_parse_json(text: str) -> Optional[Dict]:
    """Try to extract and parse JSON from LLM response."""
    # Strip markdown code blocks if present
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("```").strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting first {...} or [...]
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    return None


def _format_source_metadata(chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Return consolidated source info from retrieved chunks."""
    if not chunks:
        return {}
    top = chunks[0]
    return {
        "source_authority": top.get("source_authority", ""),
        "document_name": top.get("document_name", ""),
        "document_date": top.get("document_date", ""),
        "source_url": top.get("source_url", ""),
        "verified": top.get("verified", False),
    }


async def get_rag_response(
    disaster_type: str,
    damage_percent: int,
    severity: str,
    step: str,
) -> Dict[str, Any]:
    """
    Main entry point for Disaster Relief RAG.

    Args:
        disaster_type: e.g. 'flood', 'fire', 'earthquake'
        damage_percent: 0–100
        severity: 'Minor' | 'Moderate' | 'Major' | 'Severe'
        step: 'schemes' | 'eligibility' | 'documents' | 'timeline'

    Returns:
        Structured dict with RAG result + source metadata.
        Always returns a usable dict — never raises.
    """
    try:
        damage_info = f"{damage_percent}% damage, severity: {severity}"
        chunks = await retrieve_disaster_chunks(disaster_type, step, damage_info, limit=5)

        if not chunks:
            return {
                "rag_available": False,
                "message": f"No verified government information found for {disaster_type} — {step}.",
                "sources": [],
            }

        prompt = _build_prompt(step, disaster_type, damage_info, chunks)

        # Call LLM (runs synchronous generate in executor)
        loop = asyncio.get_event_loop()
        raw_text = await loop.run_in_executor(None, _call_llm, prompt)

        parsed = _safe_parse_json(raw_text)

        if parsed is None:
            return {
                "rag_available": False,
                "message": "AI response could not be parsed. Government source information is being loaded.",
                "raw_response": raw_text[:500] if raw_text else "",
                "sources": [_format_source_metadata(chunks)],
            }

        # Attach source metadata if not already present
        src_meta = _format_source_metadata(chunks)
        if isinstance(parsed, dict):
            parsed.setdefault("source_authority", src_meta.get("source_authority", ""))
            parsed.setdefault("document_name", src_meta.get("document_name", ""))
            parsed.setdefault("source_url", src_meta.get("source_url", ""))
            parsed.setdefault("verified", src_meta.get("verified", False))

        # Attach all chunk sources for UI display
        sources = []
        for ch in chunks:
            sources.append({
                "authority": ch.get("source_authority", ""),
                "document": ch.get("document_name", ""),
                "date": ch.get("document_date", ""),
                "url": ch.get("source_url", ""),
                "verified": ch.get("verified", False),
            })

        return {
            "rag_available": True,
            "disaster_type": disaster_type,
            "step": step,
            "data": parsed,
            "sources": sources,
        }

    except Exception as exc:
        logger.error(f"[DisasterRAG] get_rag_response failed ({step}): {exc}", exc_info=True)
        return {
            "rag_available": False,
            "message": "Verified government information service is temporarily unavailable.",
            "sources": [],
        }
