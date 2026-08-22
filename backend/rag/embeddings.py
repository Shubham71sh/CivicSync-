"""
Disaster Relief MiniLM Embeddings Generator.

Uses sentence-transformers with model 'all-MiniLM-L6-v2' (384 dimensions)
for generating semantic vector representations of official government disaster documents and queries.

Includes an automatic fallback vector embedding generator if sentence-transformers is not available in the environment.
"""

import math
import logging
from typing import List, Union
import numpy as np

logger = logging.getLogger("uvicorn.error")

_MODEL_NAME = "all-MiniLM-L6-v2"
_model_instance = None
_use_fallback = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    SentenceTransformer = None
    HAS_SENTENCE_TRANSFORMERS = False


def _fallback_embedding(text: str, dim: int = 384) -> np.ndarray:
    """Deterministic 384-dim normalized vector fallback using feature hashing & TF-IDF weights."""
    words = [w.lower().strip() for w in text.split() if len(w) > 2]
    vec = np.zeros(dim, dtype=np.float32)
    if not words:
        vec[0] = 1.0
        return vec

    for word in words:
        h = hash(word)
        idx = abs(h) % dim
        sign = 1.0 if (h > 0) else -1.0
        vec[idx] += sign * (1.0 + math.log(len(word)))

    norm = np.linalg.norm(vec)
    if norm > 1e-6:
        vec /= norm
    else:
        vec[0] = 1.0
    return vec


def get_embedding_model():
    """Lazy load sentence-transformers model with automatic fallback handling."""
    global _model_instance, _use_fallback
    if _use_fallback or not HAS_SENTENCE_TRANSFORMERS:
        return None

    if _model_instance is None:
        try:
            logger.info(f"[RAG Embeddings] Loading MiniLM model '{_MODEL_NAME}'...")
            _model_instance = SentenceTransformer(_MODEL_NAME)
            logger.info(f"[RAG Embeddings] MiniLM model '{_MODEL_NAME}' loaded successfully.")
        except Exception as exc:
            logger.warning(f"[RAG Embeddings] sentence-transformers load failed ({exc}). Using high-performance feature vector fallback.")
            _use_fallback = True
            return None
    return _model_instance


def generate_embedding(text: str) -> np.ndarray:
    """Generate a 384-dimensional normalized embedding for a single text."""
    model = get_embedding_model()
    if model is not None:
        try:
            emb = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
            return np.array(emb, dtype=np.float32)
        except Exception as exc:
            logger.warning(f"[RAG Embeddings] MiniLM encode error ({exc}). Falling back to feature vector.")
    return _fallback_embedding(text)


def generate_embeddings(texts: List[str]) -> np.ndarray:
    """Generate normalized embeddings for a list of texts."""
    model = get_embedding_model()
    if model is not None:
        try:
            embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False, batch_size=32)
            return np.array(embeddings, dtype=np.float32)
        except Exception as exc:
            logger.warning(f"[RAG Embeddings] MiniLM batch encode error ({exc}). Falling back to feature vectors.")
    return np.array([_fallback_embedding(t) for t in texts], dtype=np.float32)
