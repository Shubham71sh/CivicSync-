"""
Disaster Relief Semantic Retriever.

Provides semantic similarity search powered by FAISS + MiniLM,
with domain-specific contextual boosting and deduplication.
"""

from typing import List, Dict, Any, Optional
from rag.vector_store import get_vector_store


def retrieve_relevant_schemes(
    disaster_type: str,
    damage_percent: int,
    severity: str = "Moderate",
    location: Optional[str] = None,
    limit: int = 6,
) -> List[Dict[str, Any]]:
    """
    Retrieve official government disaster relief schemes matching the user's
    disaster type, damage severity, and location using FAISS vector search.
    """
    store = get_vector_store()
    query = (
        f"Government relief scheme assistance compensation for {disaster_type} calamity "
        f"with {damage_percent}% damage severity {severity}. "
        f"Housing reconstruction repair input subsidy gratuitous relief grant {location or ''}"
    )

    matches = store.search(
        query=query,
        top_k=limit,
        disaster_type=disaster_type,
        category="schemes",
    )

    schemes = []
    seen_ids = set()
    for chunk, score in matches:
        s_id = chunk.get("scheme_id", chunk.get("chunk_id"))
        if s_id in seen_ids:
            continue
        seen_ids.add(s_id)
        schemes.append({
            "id": s_id,
            "scheme_id": s_id,
            "name": chunk.get("scheme_name"),
            "official_name": chunk.get("scheme_name"),
            "scheme_name": chunk.get("scheme_name"),
            "authority": chunk.get("official_department"),
            "source_authority": chunk.get("official_department"),
            "disaster_type": chunk.get("disaster_type"),
            "relief_amount": chunk.get("relief_amount"),
            "min_damage": chunk.get("min_damage", 30),
            "max_damage": chunk.get("max_damage", 100),
            "benefits": chunk.get("benefits", []),
            "required_documents": chunk.get("required_documents", []),
            "official_source_url": chunk.get("official_source_url"),
            "source_url": chunk.get("official_source_url"),
            "source_document": chunk.get("source_document"),
            "document_name": chunk.get("source_document"),
            "verified": chunk.get("verified", True),
            "processing_days": chunk.get("processing_days", 14),
            "similarity_score": round(score, 4),
            "text": chunk.get("text"),
        })

    return schemes


def retrieve_eligibility_context(
    disaster_type: str,
    damage_percent: int,
    severity: str = "Moderate",
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Retrieve official eligibility guidelines matching the disaster and damage profile."""
    store = get_vector_store()
    query = (
        f"Eligibility criteria conditions norms for {disaster_type} relief with {damage_percent}% {severity} damage. "
        f"Qualifying thresholds, verified damage proof, beneficiary ownership."
    )
    matches = store.search(
        query=query,
        top_k=limit,
        disaster_type=disaster_type,
        category="eligibility",
    )
    return [chunk for chunk, score in matches]


def retrieve_documents_context(
    disaster_type: str,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Retrieve official required document specifications for the disaster."""
    store = get_vector_store()
    query = f"Required documents certificates verification proofs for {disaster_type} relief application."
    matches = store.search(
        query=query,
        top_k=limit,
        disaster_type=disaster_type,
        category="documents",
    )
    return [chunk for chunk, score in matches]


def retrieve_timeline_context(
    disaster_type: str,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Retrieve official claim processing stages and field inspection workflow."""
    store = get_vector_store()
    query = f"Application submission process field inspection verification stages timeline for {disaster_type} relief claim."
    matches = store.search(
        query=query,
        top_k=limit,
        disaster_type=disaster_type,
        category="timeline",
    )
    return [chunk for chunk, score in matches]
