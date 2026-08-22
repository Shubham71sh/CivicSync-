"""
Vector Store Manager for Disaster Relief RAG.

Uses FAISS (IndexFlatIP) for cosine similarity search when available,
and seamlessly falls back to NumPy matrix dot-product cosine similarity if FAISS is not installed.
"""

import os
import json
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    faiss = None
    HAS_FAISS = False

from rag.documents.official_disaster_data import OFFICIAL_SCHEMES
from rag.chunking import chunk_all_official_schemes
from rag.embeddings import generate_embeddings, generate_embedding

logger = logging.getLogger("uvicorn.error")

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_DIR = os.path.join(_CURRENT_DIR, "index")
INDEX_PATH = os.path.join(INDEX_DIR, "disaster_relief.faiss")
NUMPY_VECS_PATH = os.path.join(INDEX_DIR, "vectors.npy")
METADATA_PATH = os.path.join(INDEX_DIR, "metadata.json")

_vector_store_instance = None


class FAISSVectorStore:
    def __init__(self):
        self.index = None
        self.vectors: Optional[np.ndarray] = None
        self.metadata: List[Dict[str, Any]] = []
        self.dimension: int = 384
        os.makedirs(INDEX_DIR, exist_ok=True)

    def is_built(self) -> bool:
        return os.path.exists(METADATA_PATH) and (os.path.exists(INDEX_PATH) or os.path.exists(NUMPY_VECS_PATH))

    def build_and_save(self) -> int:
        """Chunk official schemes, generate MiniLM embeddings, build FAISS/NumPy index, and persist."""
        logger.info("[VectorStore] Building Vector Index from official government disaster knowledge base...")
        chunks = chunk_all_official_schemes(OFFICIAL_SCHEMES)
        texts = [c["text"] for c in chunks]

        # Generate embeddings (384-dim normalized)
        embeddings = generate_embeddings(texts)
        self.dimension = embeddings.shape[1]
        self.vectors = embeddings
        self.metadata = chunks

        # Save NumPy vectors
        np.save(NUMPY_VECS_PATH, embeddings)

        # Build FAISS index if available
        if HAS_FAISS:
            try:
                self.index = faiss.IndexFlatIP(self.dimension)
                self.index.add(embeddings)
                faiss.write_index(self.index, INDEX_PATH)
                logger.info(f"[VectorStore] Built and saved FAISS index with {self.index.ntotal} chunks.")
            except Exception as exc:
                logger.warning(f"[VectorStore] FAISS build error ({exc}). Using NumPy vector store.")

        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)

        logger.info(f"[VectorStore] Index creation complete for {len(chunks)} chunks.")
        return len(chunks)

    def load(self):
        """Load index and metadata from disk, or build automatically if not present."""
        if not self.is_built():
            self.build_and_save()
            return

        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

            if HAS_FAISS and os.path.exists(INDEX_PATH):
                self.index = faiss.read_index(INDEX_PATH)
                logger.info(f"[VectorStore] Loaded FAISS index with {self.index.ntotal} chunks.")
            elif os.path.exists(NUMPY_VECS_PATH):
                self.vectors = np.load(NUMPY_VECS_PATH)
                logger.info(f"[VectorStore] Loaded NumPy vector store with {len(self.vectors)} chunks.")
            else:
                self.build_and_save()
        except Exception as exc:
            logger.warning(f"[VectorStore] Error loading index ({exc}). Rebuilding fresh index...")
            self.build_and_save()

    def search(
        self,
        query: str,
        top_k: int = 5,
        disaster_type: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[Tuple[Dict[str, Any], float]]:
        """
        Perform vector similarity search using MiniLM query embedding.
        Filters by disaster_type and category if specified.
        Returns list of (chunk_metadata, similarity_score).
        """
        if (self.index is None and self.vectors is None) or not self.metadata:
            self.load()

        query_emb = generate_embedding(query).reshape(1, -1)

        # 1. FAISS Search if active
        if self.index is not None:
            k_fetch = min(top_k * 4, self.index.ntotal)
            scores, indices = self.index.search(query_emb, k_fetch)
            candidate_scores = list(scores[0])
            candidate_indices = list(indices[0])
        # 2. NumPy Cosine Similarity Search fallback
        elif self.vectors is not None:
            # Cosine similarity between normalized query vector and document matrix
            scores_arr = np.dot(self.vectors, query_emb.T).flatten()
            sorted_indices = np.argsort(scores_arr)[::-1]
            candidate_indices = list(sorted_indices[: top_k * 4])
            candidate_scores = [float(scores_arr[i]) for i in candidate_indices]
        else:
            candidate_indices = []
            candidate_scores = []

        results = []
        norm_disaster = (disaster_type or "").lower().replace(" ", "_").replace("-", "_")

        for score, idx in zip(candidate_scores, candidate_indices):
            if idx < 0 or idx >= len(self.metadata):
                continue
            chunk = self.metadata[idx]

            # Filter by disaster if provided
            if norm_disaster:
                chunk_disaster = chunk.get("disaster_type", "").lower().replace(" ", "_")
                if norm_disaster in ["rain", "heavy_rain", "heavyrain", "cloudburst"]:
                    if chunk_disaster not in ["heavy_rain", "flood"]:
                        continue
                else:
                    if chunk_disaster != norm_disaster:
                        continue

            # Filter by category if provided
            if category:
                if chunk.get("category") != category:
                    continue

            results.append((chunk, float(score)))
            if len(results) >= top_k:
                break

        # Fallback if filtered search returned fewer than needed
        if len(results) < top_k and norm_disaster:
            for score, idx in zip(candidate_scores, candidate_indices):
                if idx < 0 or idx >= len(self.metadata):
                    continue
                chunk = self.metadata[idx]
                chunk_disaster = chunk.get("disaster_type", "").lower().replace(" ", "_")
                if (norm_disaster in chunk_disaster or chunk_disaster in norm_disaster) and not any(r[0]["chunk_id"] == chunk["chunk_id"] for r in results):
                    results.append((chunk, float(score)))
                if len(results) >= top_k:
                    break

        return results


def get_vector_store() -> FAISSVectorStore:
    """Singleton getter for the Vector store."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = FAISSVectorStore()
        _vector_store_instance.load()
    return _vector_store_instance
