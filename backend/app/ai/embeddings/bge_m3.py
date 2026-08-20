"""
BGE-M3 Embedding Service — Singleton.

Loads BAAI/bge-m3 ONCE at first use (lazy singleton).
Reused for every embedding request — never reloaded per request.

Features:
- Multilingual support (BGE-M3 handles 100+ languages)
- L2-normalized embeddings (cosine similarity = dot product)
- Batch embedding support
- Query-mode vs document-mode (BGE-M3 uses same encoder for both)
- Graceful degradation: returns zero-vector if model unavailable

Usage:
    from app.ai.embeddings.bge_m3 import get_embedding_service
    svc = get_embedding_service()
    vector = svc.embed_query("What schemes are available for farmers?")
    vectors = svc.embed_documents(["text 1", "text 2"])
"""

import logging
import threading
from typing import List, Optional

# pyrefly: ignore [missing-import]
import numpy as np

from app.config.settings import settings

logger = logging.getLogger("uvicorn.error")

# ── Thread-safe singleton ─────────────────────────────────────────────────────
_instance: Optional["BGE_M3_EmbeddingService"] = None
_lock = threading.Lock()


def get_embedding_service() -> "BGE_M3_EmbeddingService":
    """Return the module-level singleton, creating it if necessary."""
    global _instance
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = BGE_M3_EmbeddingService()
    return _instance


# ── BGE-M3 Service ────────────────────────────────────────────────────────────

class BGE_M3_EmbeddingService:
    """
    Thread-safe BGE-M3 embedding service.

    The model is loaded lazily on first call to any embed_* method.
    Subsequent calls reuse the already-loaded model.
    """

    @property
    def vector_dim(self) -> int:
        return settings.EMBEDDING_DIMENSION

    @property
    def fallback_vector(self) -> List[float]:
        return [0.0] * self.vector_dim

    def __init__(self):
        self._model = None
        self._model_lock = threading.Lock()
        self._model_name = settings.EMBEDDING_MODEL
        self._available = False
        logger.info(f"[Embedding] Service initialized (model will load on first use: {self._model_name})")

    def _load_model(self):
        """Load the model if not already loaded. Thread-safe."""
        if self._model is not None:
            return
        with self._model_lock:
            if self._model is not None:
                return
            try:
                logger.info(f"[Embedding] Loading model '{self._model_name}'... (this may take a moment on first run)")
                # pyre-ignore [missing-import]
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self._model_name)
                self._available = True
                logger.info(f"[Embedding] Model '{self._model_name}' loaded successfully.")
            except ImportError:
                logger.error(
                    "[Embedding] sentence-transformers not installed. "
                    "Run: pip install sentence-transformers"
                )
                self._available = False
            except Exception as exc:
                logger.error(f"[Embedding] Failed to load model: {exc}", exc_info=True)
                self._available = False

    # ── Public interface ──────────────────────────────────────────────────────

    def embed_text(self, text: str) -> List[float]:
        """
        Embed a single text string.

        Returns:
            L2-normalized float vector of dimension,
            or zero vector if model unavailable.
        """
        results = self.embed_documents([text])
        return results[0] if results else self.fallback_vector[:]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a list of document texts (batch).

        Returns:
            List of L2-normalized float vectors.
            Returns list of zero-vectors if model unavailable.
        """
        if not texts:
            return []

        self._load_model()

        if not self._available or self._model is None:
            logger.warning("[Embedding] Model unavailable — returning zero vectors.")
            return [self.fallback_vector[:] for _ in texts]

        try:
            # Clean and truncate each text
            cleaned = [self._clean(t) for t in texts]

            # Encode in batch; normalize=True gives L2-normalized vectors
            # convert_to_numpy=True gives numpy arrays
            embeddings = self._model.encode(
                cleaned,
                normalize_embeddings=True,
                batch_size=32,
                show_progress_bar=False,
                convert_to_numpy=True,
            )

            return [emb.tolist() for emb in embeddings]

        except Exception as exc:
            logger.error(f"[Embedding] embed_documents() failed: {exc}", exc_info=True)
            return [self.fallback_vector[:] for _ in texts]

    def embed_query(self, query: str) -> List[float]:
        """
        Embed a user query string.

        Returns:
            L2-normalized float vector.
        """
        # Prepend "query: " only if the active model is BGE-M3
        if "bge" in self._model_name.lower():
            prefixed = f"query: {query.strip()}"
        else:
            prefixed = query.strip()
        return self.embed_text(prefixed)

    def is_available(self) -> bool:
        """Return True if the model is loaded and ready."""
        if not self._available and self._model is None:
            # Attempt to load
            self._load_model()
        return self._available

    def get_model_name(self) -> str:
        return self._model_name

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _clean(text: str) -> str:
        """Clean and truncate text for embedding."""
        if not text:
            return ""
        # Collapse excessive whitespace
        cleaned = " ".join(text.split())
        # BGE-M3 supports up to 8192 tokens but we cap at ~4000 chars
        # to avoid memory issues with very long documents
        return cleaned[:4000]
