"""
Reranker — BGE cross-encoder reranker.

Uses BAAI/bge-reranker-v2-m3 to rerank retrieved chunks by relevance to the query.
This is a cross-encoder (query + passage together) which is more accurate than
bi-encoder similarity, but slower — applied only to the top-K candidates.

Configuration:
    RERANK_ENABLED=true     — enable/disable reranking
    RERANK_MODEL=BAAI/bge-reranker-v2-m3

Fallback:
    If the reranker model is unavailable or disabled, falls back to returning
    chunks sorted by vector similarity score (already ranked from Qdrant).
    The application never crashes due to reranker unavailability.
"""

import logging
import threading
from typing import Any, Dict, List, Optional

from app.config.settings import settings

logger = logging.getLogger("uvicorn.error")


class Reranker:
    """
    Thread-safe BGE reranker singleton.

    Loads the cross-encoder model lazily on first use.
    Falls back to score-based sorting if model unavailable.
    """

    def __init__(self):
        self._model = None
        self._available = False
        self._lock = threading.Lock()
        self._enabled = settings.RERANK_ENABLED
        self._model_name = settings.RERANK_MODEL

        if not self._enabled:
            logger.info("[Reranker] Disabled via RERANK_ENABLED=false — using vector similarity ranking.")

    def _load_model(self):
        """Lazily load the reranker cross-encoder model."""
        if self._model is not None or not self._enabled:
            return
        with self._lock:
            if self._model is not None:
                return
            try:
                from sentence_transformers import CrossEncoder
                logger.info(f"[Reranker] Loading cross-encoder '{self._model_name}'...")
                self._model = CrossEncoder(self._model_name, max_length=512)
                self._available = True
                logger.info(f"[Reranker] Cross-encoder '{self._model_name}' loaded.")
            except ImportError:
                logger.warning("[Reranker] sentence-transformers not installed — using fallback ranking.")
                self._available = False
            except Exception as exc:
                logger.warning(f"[Reranker] Could not load model '{self._model_name}': {exc}. Using fallback.")
                self._available = False

    def rerank(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Rerank chunks by cross-encoder relevance to the query.

        Args:
            query:  User question / search query.
            chunks: List of chunk dicts (each must have "payload.text").
            top_k:  Final number of chunks to return.

        Returns:
            Top-K chunks sorted by reranker score (desc).
            Falls back to hybrid/vector score if reranker unavailable.
        """
        if not chunks:
            return []

        if not self._enabled:
            return self._fallback_rank(chunks, top_k)

        self._load_model()

        if not self._available or self._model is None:
            return self._fallback_rank(chunks, top_k)

        try:
            # Build (query, passage) pairs
            pairs = [
                (query, chunk.get("payload", {}).get("text", "")[:512])
                for chunk in chunks
            ]

            # Cross-encoder produces a relevance score per pair
            scores = self._model.predict(pairs, show_progress_bar=False)

            # Attach reranker scores
            scored_chunks = []
            for chunk, score in zip(chunks, scores):
                entry = dict(chunk)
                entry["reranker_score"] = float(score)
                scored_chunks.append(entry)

            # Sort by reranker score descending
            scored_chunks.sort(key=lambda x: x.get("reranker_score", 0.0), reverse=True)

            logger.debug(f"[Reranker] Reranked {len(chunks)} chunks → returning top {top_k}.")
            return scored_chunks[:top_k]

        except Exception as exc:
            logger.error(f"[Reranker] rerank() failed: {exc}. Using fallback.", exc_info=True)
            return self._fallback_rank(chunks, top_k)

    def _fallback_rank(self, chunks: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
        """
        Fallback: sort by hybrid_score, then vector score, then return top-k.
        """
        sorted_chunks = sorted(
            chunks,
            key=lambda x: (
                x.get("hybrid_score", 0.0),
                x.get("vector_score", x.get("score", 0.0)),
            ),
            reverse=True,
        )
        return sorted_chunks[:top_k]

    def is_available(self) -> bool:
        if not self._enabled:
            return False
        if self._model is None:
            self._load_model()
        return self._available


# ── Module-level singleton ────────────────────────────────────────────────────
_reranker: Optional[Reranker] = None


def get_reranker() -> Reranker:
    global _reranker
    if _reranker is None:
        _reranker = Reranker()
    return _reranker
