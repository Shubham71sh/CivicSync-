"""
VectorStore — FAISS + MiniLM semantic index over Firestore documents.

How it works:
1. Fetches documents from 3 Firestore collections (government_documents, bills, schemes)
2. Converts each document into a text string
3. Encodes all texts using MiniLM (all-MiniLM-L6-v2) — a fast, lightweight
   sentence-transformer model that produces 384-dimensional embeddings
4. Builds a FAISS IndexFlatIP (inner-product / cosine similarity) index
5. Caches the index in memory for 5 minutes — no re-encoding on every request

Why MiniLM?
- 80x faster than large models like BERT-large
- Only 22M parameters — loads in ~1 second
- 384-dim embeddings fit entirely in RAM even for 1000s of docs
- Tuned for semantic similarity — "flood relief" matches "disaster assistance"

Why FAISS?
- Sub-millisecond search across thousands of vectors
- Runs fully in-process — no Docker, no external server needed
- IndexFlatIP gives exact cosine similarity (no approximation loss for small corpora)
"""

import time
import asyncio
import logging
import numpy as np
from typing import Any, Dict, List, Optional, Tuple

import faiss
from sentence_transformers import SentenceTransformer

from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")

# ── MiniLM model — loaded once at module level ────────────────────────────────
# all-MiniLM-L6-v2: 22M params, 384-dim, ~80ms to encode 100 sentences on CPU
_MODEL_NAME = "all-MiniLM-L6-v2"
_encoder: Optional[SentenceTransformer] = None


def _get_encoder() -> SentenceTransformer:
    global _encoder
    if _encoder is None:
        logger.info(f"Loading MiniLM model: {_MODEL_NAME} ...")
        _encoder = SentenceTransformer(_MODEL_NAME)
        logger.info("MiniLM model loaded.")
    return _encoder


# ── Module-level FAISS index cache ────────────────────────────────────────────
# Tuple of (timestamp, faiss_index, doc_list)
_INDEX_CACHE: Tuple[float, Optional[faiss.Index], List[dict]] = (0.0, None, [])
_CACHE_TTL_SECONDS = 300  # rebuild index every 5 minutes


def invalidate_index():
    """Call this whenever a document is added/updated/deleted in Firestore."""
    global _INDEX_CACHE
    _INDEX_CACHE = (0.0, None, [])
    logger.info("FAISS index cache invalidated.")


# ── Document text extraction (same fields as before) ─────────────────────────

def _safe_join(items) -> str:
    if not items:
        return ""
    parts = []
    for item in items:
        if isinstance(item, str):
            parts.append(item)
        elif isinstance(item, dict):
            parts.append(" ".join(str(v) for v in item.values()))
        else:
            parts.append(str(item))
    return " ".join(parts)


def _document_to_text(doc: Dict[str, Any]) -> str:
    """Combine all meaningful fields into a single string for embedding."""
    fields = [
        doc.get("title", ""),
        doc.get("name", ""),
        doc.get("billNumber", ""),
        doc.get("summary", ""),
        doc.get("description", ""),
        doc.get("content", ""),
        doc.get("category", ""),
        doc.get("objectives", ""),
        doc.get("provisions", ""),
        doc.get("eligibility", ""),
        doc.get("benefits", ""),
        doc.get("state", ""),
        doc.get("userImpact", ""),
        doc.get("extractedText", ""),
    ]
    text = " ".join(str(f) for f in fields if f)

    for field in ("tags", "keyPoints", "eligibilityCriteria"):
        val = doc.get(field)
        if val:
            text += " " + _safe_join(val)

    # Truncate to 512 tokens worth of text (~2000 chars) — MiniLM max is 256 tokens
    # The model auto-truncates but trimming here keeps embeddings more focused
    return text[:2000].strip()


# ── FAISS index builder ───────────────────────────────────────────────────────

def _build_index(docs: List[dict]) -> faiss.Index:
    """
    Encode all document texts with MiniLM and build a FAISS cosine index.
    Uses IndexFlatIP (inner product) after L2-normalising vectors → cosine similarity.
    """
    encoder = _get_encoder()
    texts = [_document_to_text(doc) for doc in docs]

    # Encode in one batch — sentence-transformers handles batching internally
    embeddings = encoder.encode(
        texts,
        batch_size=64,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,   # L2 norm → inner product = cosine similarity
    )

    dim = embeddings.shape[1]  # 384 for MiniLM
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings.astype(np.float32))
    logger.info(f"FAISS index built: {index.ntotal} vectors, dim={dim}")
    return index


# ── Main async API ────────────────────────────────────────────────────────────

async def get_index() -> Tuple[faiss.Index, List[dict]]:
    """
    Return (faiss_index, docs_list) from cache, rebuilding if TTL has expired.
    Thread-safe: Firestore fetch + encoding runs in executor so the event loop
    is never blocked.
    """
    global _INDEX_CACHE
    cached_at, index, docs = _INDEX_CACHE

    if index is not None and (time.monotonic() - cached_at) < _CACHE_TTL_SECONDS:
        return index, docs

    # Cache miss — fetch + encode in a thread so async loop stays free
    loop = asyncio.get_event_loop()

    def _fetch_and_build():
        # 1. Fetch from Firestore
        gov_docs = list(get_col("government_documents").limit(200).stream())
        bills    = list(get_col("bills").limit(200).stream())
        schemes  = list(get_col("schemes").limit(200).stream())
        raw      = gov_docs + bills + schemes

        # 2. Convert snapshots to dicts
        all_docs = []
        for snap in raw:
            d = snap.to_dict() or {}
            d["id"] = snap.id
            all_docs.append(d)

        # 3. Build FAISS index
        faiss_index = _build_index(all_docs)
        return faiss_index, all_docs

    new_index, new_docs = await loop.run_in_executor(None, _fetch_and_build)
    _INDEX_CACHE = (time.monotonic(), new_index, new_docs)
    return new_index, new_docs


async def search(
    query: str,
    profile: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    top_k: int = 3,
) -> List[dict]:
    """
    Semantic search using MiniLM + FAISS.

    1. Encode the query (+ profile context) with MiniLM
    2. Search FAISS index for top_k nearest neighbours
    3. Apply visibility filter
    4. Return ranked docs with contextExcerpt and retrievalScore
    """
    encoder = _get_encoder()
    index, docs = await get_index()

    if index.ntotal == 0:
        return []

    # ── Query text: combine question + key profile terms for personalised search
    profile_context = ""
    if profile:
        profile_parts = [
            profile.get("location", ""),
            profile.get("profession", ""),
            profile.get("income", ""),
            profile.get("category", ""),
            profile.get("employmentStatus", ""),
        ]
        profile_context = " ".join(p for p in profile_parts if p)

    query_text = f"{query} {profile_context}".strip()

    # ── Encode query in executor so event loop stays free ─────────────────────
    loop = asyncio.get_event_loop()
    query_vec = await loop.run_in_executor(
        None,
        lambda: encoder.encode(
            [query_text],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
    )
    query_vec = query_vec.astype(np.float32)

    # ── FAISS search — returns cosine similarity scores + indices ─────────────
    k = min(top_k * 5, index.ntotal)   # fetch extra, then filter by visibility
    scores, indices = index.search(query_vec, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(docs):
            continue

        doc = docs[idx]

        # ── Visibility filter ─────────────────────────────────────────────────
        is_owner = (
            user_id is not None
            and str(doc.get("userId")) == str(user_id)
        )
        is_shared = (
            doc.get("isGovernmentDocument") is True
            or doc.get("visibility") == "government"
        )
        is_public = (
            doc.get("status") in ("active", "passed", "pending", "under_review")
            or doc.get("name") is not None
            or doc.get("billNumber") is not None
        )
        if not (is_owner or is_shared or is_public):
            continue

        result = dict(doc)
        result["retrievalScore"] = float(score)
        result["contextExcerpt"] = _document_to_text(doc)[:800]  # trimmed from 2000 to fit token limit
        results.append(result)

        if len(results) >= top_k:
            break

    return results
