"""
Hybrid Search — combines vector similarity scores with BM25-style lexical scores.

This is a lightweight in-memory fusion layer that merges:
1. Qdrant vector search results (cosine similarity)
2. Lexical term-frequency scores (BM25-inspired, computed over retrieved chunks)

Using Reciprocal Rank Fusion (RRF) to merge the two ranked lists.

RRF formula: score = Σ(1 / (k + rank_i))
where k=60 is a smoothing constant and rank_i is the position in each ranked list.
"""

import math
import re
from typing import Any, Dict, List


# ── BM25-style lexical scoring ────────────────────────────────────────────────

_STOPWORDS = {
    "a", "an", "the", "is", "of", "to", "and", "in", "on", "for",
    "about", "tell", "me", "please", "how", "can", "i", "my", "do",
    "does", "with", "under", "from", "am", "what", "are", "this",
    "that", "it", "be", "have", "has", "was", "were", "will", "would",
}


def _tokenize(text: str) -> List[str]:
    tokens = re.findall(r"\b\w+\b", text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 2]


def _bm25_score(query_tokens: List[str], doc_text: str, k1: float = 1.5, b: float = 0.75) -> float:
    """
    Approximate BM25 score for a single document.
    Treats the entire chunk text as one document.
    """
    if not query_tokens or not doc_text:
        return 0.0

    doc_tokens = _tokenize(doc_text)
    doc_len = len(doc_tokens)

    if doc_len == 0:
        return 0.0

    from collections import Counter
    term_freq = Counter(doc_tokens)

    # Average document length — approximate constant since we chunk uniformly
    avg_dl = 800.0

    score = 0.0
    for term in query_tokens:
        tf = term_freq.get(term, 0)
        if tf == 0:
            continue
        # BM25 term weight (IDF is simplified since we don't have a full corpus)
        idf = math.log(1 + (1.0 / (tf + 0.5)))
        numerator = tf * (k1 + 1)
        denominator = tf + k1 * (1 - b + b * doc_len / avg_dl)
        score += idf * (numerator / denominator)

    return score


# ── Reciprocal Rank Fusion ────────────────────────────────────────────────────

def _rrf_merge(
    vector_results: List[Dict[str, Any]],
    lexical_results: List[Dict[str, Any]],
    k: int = 60,
    vector_weight: float = 0.7,
    lexical_weight: float = 0.3,
) -> List[Dict[str, Any]]:
    """
    Merge two ranked lists using Reciprocal Rank Fusion.

    Args:
        vector_results:  Results from Qdrant, sorted by cosine similarity (desc).
        lexical_results: Results from BM25, sorted by lexical score (desc).
        k:               RRF smoothing constant (60 is standard).
        vector_weight:   Weight for vector rank score.
        lexical_weight:  Weight for lexical rank score.

    Returns:
        Merged list, sorted by combined RRF score (desc).
    """
    combined: Dict[str, Dict[str, Any]] = {}

    # Add vector scores
    for rank, item in enumerate(vector_results):
        chunk_id = item.get("id", str(rank))
        rrf_score = vector_weight / (k + rank + 1)
        if chunk_id not in combined:
            combined[chunk_id] = dict(item)
            combined[chunk_id]["hybrid_score"] = 0.0
        combined[chunk_id]["hybrid_score"] += rrf_score
        combined[chunk_id]["vector_score"] = item.get("score", 0.0)

    # Add lexical scores
    for rank, item in enumerate(lexical_results):
        chunk_id = item.get("id", str(rank))
        rrf_score = lexical_weight / (k + rank + 1)
        if chunk_id not in combined:
            combined[chunk_id] = dict(item)
            combined[chunk_id]["hybrid_score"] = 0.0
        combined[chunk_id]["hybrid_score"] += rrf_score
        combined[chunk_id]["lexical_score"] = item.get("lexical_score", 0.0)

    # Sort by combined hybrid score
    merged = sorted(combined.values(), key=lambda x: x.get("hybrid_score", 0.0), reverse=True)
    return merged


# ── Public API ────────────────────────────────────────────────────────────────

def hybrid_rerank(
    query: str,
    vector_results: List[Dict[str, Any]],
    top_k: int = 20,
) -> List[Dict[str, Any]]:
    """
    Perform hybrid ranking: combine Qdrant vector results with BM25 lexical scores.

    Args:
        query:          Original user query string.
        vector_results: Results from Qdrant semantic search.
        top_k:          Maximum results to return.

    Returns:
        Hybrid-ranked list of chunk dicts, up to top_k items.
    """
    if not vector_results:
        return []

    query_tokens = _tokenize(query)

    # Compute lexical scores for all retrieved chunks
    lexical_scored = []
    for item in vector_results:
        text = item.get("payload", {}).get("text", "")
        lex_score = _bm25_score(query_tokens, text)
        entry = dict(item)
        entry["lexical_score"] = lex_score
        lexical_scored.append(entry)

    # Sort by lexical score for lexical ranked list
    lexical_sorted = sorted(lexical_scored, key=lambda x: x.get("lexical_score", 0.0), reverse=True)

    # Merge via RRF
    merged = _rrf_merge(
        vector_results=vector_results,
        lexical_results=lexical_sorted,
        vector_weight=0.7,
        lexical_weight=0.3,
    )

    return merged[:top_k]
