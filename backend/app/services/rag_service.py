"""
RAG Service — FastAPI + FAISS + MiniLM semantic retrieval.

Architecture:
- Old approach: keyword term-frequency scoring (no semantics, slow Firestore reads)
- New approach: MiniLM sentence embeddings + FAISS vector index (semantic search)

Flow:
  1. VectorStore loads all docs from Firestore, encodes with MiniLM, builds FAISS index
  2. On each search: query + profile context → MiniLM embedding → FAISS cosine search
  3. Top-k results returned in < 5ms (after warm cache)

Cache:
  - FAISS index lives in memory, rebuilt every 5 minutes
  - First request after startup triggers index build (~2-3s), all subsequent < 5ms
"""

from typing import Any, Dict, List, Optional
from app.services import vector_store


class RAGService:
    """Semantic document retrieval using FAISS + MiniLM embeddings."""

    def __init__(self, db=None):
        # db accepted for backward compatibility with ChatService(db)
        pass

    async def search_documents(
        self,
        question: str,
        profile: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        limit: int = 3,
    ) -> List[dict]:
        """
        Semantic search: encode question + profile with MiniLM,
        find nearest neighbours in FAISS index, return top `limit` docs.
        """
        if not question or not question.strip():
            return []

        return await vector_store.search(
            query=question,
            profile=profile,
            user_id=user_id,
            top_k=limit,
        )

    async def get_sources(self, documents: List[dict]) -> List[str]:
        """Extract readable source labels from retrieved documents."""
        sources = []
        for doc in documents:
            title          = doc.get("title", "") or doc.get("name", "")
            bill_number    = doc.get("billNumber", "")
            official_source = doc.get("officialSource", "")
            state          = doc.get("state", "")

            if official_source:
                sources.append(f"{title} — {official_source}")
            elif bill_number:
                sources.append(f"{title} ({bill_number})")
            elif state and state != "All States":
                sources.append(f"{title} ({state})")
            elif title:
                sources.append(title)

        return [s for s in sources if s]

    @staticmethod
    def invalidate_cache():
        """Invalidate the FAISS index cache — call after any Firestore write."""
        vector_store.invalidate_index()
