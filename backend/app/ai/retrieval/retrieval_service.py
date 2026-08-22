"""
Retrieval Service — Orchestrates the full retrieval pipeline.

Pipeline:
  user query
    → BGE-M3 query embedding
    → ChromaDB semantic search (top RAG_TOP_K)
    → Hybrid BM25 re-scoring
    → BGE cross-encoder reranking (top RAG_FINAL_K)
    → Return structured RetrievalResult

Falls back gracefully at each step if a component is unavailable.
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.config.settings import settings
from app.ai.embeddings.bge_m3 import get_embedding_service
from app.ai.retrieval.chroma_client import get_chroma_service
from app.ai.retrieval.hybrid_search import hybrid_rerank
from app.ai.retrieval.reranker import get_reranker

logger = logging.getLogger("uvicorn.error")


@dataclass
class RetrievalChunk:
    """A single retrieved and ranked chunk with full metadata."""
    chunk_id: str = ""
    document_id: str = ""
    document_type: str = ""
    title: str = ""
    source: str = ""
    page: int = 0
    section: str = ""
    language: str = "en"
    state: str = ""
    category: str = ""
    text: str = ""
    firebase_id: str = ""
    score: float = 0.0
    vector_score: float = 0.0
    reranker_score: Optional[float] = None


@dataclass
class RetrievalResult:
    """Result of a full RAG retrieval pass."""
    chunks: List[RetrievalChunk] = field(default_factory=list)
    confidence: float = 0.0
    chroma_available: bool = False
    retrieved_count: int = 0
    final_count: int = 0


class RetrievalService:
    """
    Coordinates embedding, ChromaDB search, hybrid fusion, and reranking.

    Usage:
        svc = RetrievalService()
        result = await svc.retrieve(query="What schemes for farmers?", top_k=20, final_k=5)
    """

    async def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        final_k: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        min_score: Optional[float] = None,
    ) -> RetrievalResult:
        """
        Full retrieval pipeline.

        Args:
            query:     User question or search string.
            top_k:     Initial ChromaDB retrieval pool size (default: RAG_TOP_K).
            final_k:   Final chunks after reranking (default: RAG_FINAL_K).
            filters:   Optional metadata filters: {"document_type": "bill", "state": "Punjab"}.
            min_score: Minimum vector similarity threshold (default: RAG_MIN_SCORE).

        Returns:
            RetrievalResult with ranked chunks and confidence score.
        """
        top_k = top_k or settings.RAG_TOP_K
        final_k = final_k or settings.RAG_FINAL_K
        min_score = min_score if min_score is not None else settings.RAG_MIN_SCORE

        result = RetrievalResult()

        # ── Step 1: Embed query ───────────────────────────────────────────────
        embedding_svc = get_embedding_service()
        try:
            import asyncio
            query_vector = await asyncio.get_event_loop().run_in_executor(
                None, embedding_svc.embed_query, query
            )
        except Exception as exc:
            logger.error(f"[Retrieval] embed_query() failed: {exc}")
            return result

        # Check if we got a real vector (not all zeros)
        if all(v == 0.0 for v in query_vector[:10]):
            logger.warning("[Retrieval] Got zero vector from embedding — model may not be loaded.")
            return result

        # ── Step 2: ChromaDB semantic search ────────────────────────────────────
        chroma_svc = get_chroma_service()
        result.chroma_available = chroma_svc.is_available()

        if not result.chroma_available:
            logger.warning("[Retrieval] ChromaDB unavailable — returning empty result.")
            return result

        raw_chunks = chroma_svc.search(
            query_vector=query_vector,
            top_k=top_k,
            filters=filters,
            score_threshold=min_score,
        )
        result.retrieved_count = len(raw_chunks)

        if not raw_chunks:
            logger.info(f"[Retrieval] No chunks found for query (min_score={min_score}).")
            return result

        # ── Step 3: Hybrid BM25 fusion ────────────────────────────────────────
        try:
            hybrid_chunks = hybrid_rerank(query=query, vector_results=raw_chunks, top_k=top_k)
        except Exception as exc:
            logger.warning(f"[Retrieval] hybrid_rerank() failed: {exc}. Using vector results.")
            hybrid_chunks = raw_chunks

        # ── Step 4: Cross-encoder reranking ───────────────────────────────────
        reranker = get_reranker()
        try:
            final_chunks = reranker.rerank(query=query, chunks=hybrid_chunks, top_k=final_k)
        except Exception as exc:
            logger.warning(f"[Retrieval] reranker.rerank() failed: {exc}. Using hybrid results.")
            final_chunks = hybrid_chunks[:final_k]

        result.final_count = len(final_chunks)

        # ── Step 5: Build RetrievalChunk objects ──────────────────────────────
        result.chunks = [self._to_chunk(c) for c in final_chunks]

        # ── Step 6: Compute confidence from top scores ────────────────────────
        if result.chunks:
            top_score = result.chunks[0].score
            # Normalize: cosine similarity 0.35→0 (threshold), 1.0→1.0
            min_s = settings.RAG_MIN_SCORE
            result.confidence = min(1.0, max(0.0, (top_score - min_s) / (1.0 - min_s)))
            result.confidence = round(result.confidence, 3)

        logger.info(
            f"[Retrieval] query='{query[:50]}' "
            f"raw={result.retrieved_count} → final={result.final_count} "
            f"confidence={result.confidence:.2f}"
        )

        return result

    @staticmethod
    def _to_chunk(raw: Dict[str, Any]) -> RetrievalChunk:
        payload = raw.get("payload", {})
        return RetrievalChunk(
            chunk_id=payload.get("chunk_id", raw.get("id", "")),
            document_id=payload.get("document_id", ""),
            document_type=payload.get("document_type", ""),
            title=payload.get("title", ""),
            source=payload.get("source", ""),
            page=int(payload.get("page", 0)),
            section=payload.get("section", ""),
            language=payload.get("language", "en"),
            state=payload.get("state", ""),
            category=payload.get("category", ""),
            text=payload.get("text", ""),
            firebase_id=payload.get("firebase_id", ""),
            score=float(raw.get("hybrid_score", raw.get("score", 0.0))),
            vector_score=float(raw.get("vector_score", raw.get("score", 0.0))),
            reranker_score=raw.get("reranker_score"),
        )


# ── Module-level singleton ────────────────────────────────────────────────────
_retrieval_service: Optional[RetrievalService] = None


def get_retrieval_service() -> RetrievalService:
    global _retrieval_service
    if _retrieval_service is None:
        _retrieval_service = RetrievalService()
    return _retrieval_service
