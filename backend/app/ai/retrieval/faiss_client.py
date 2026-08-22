"""
FAISS Vector Database Service.

Manages vector search using FAISS (IndexFlatIP) and stores document metadata locally
using a persistent pickle store.

Provides a drop-in replacement for ChromaService with identical public methods:
- ensure_collection()
- upsert_chunks(chunks)
- search(query_vector, top_k, filters, score_threshold)
- delete_by_document_id(document_id)
- is_available()
- get_collection_info()
"""

import logging
import os
import pickle
import threading
import uuid
from typing import Any, Dict, List, Optional

import numpy as np
from app.config.settings import settings

logger = logging.getLogger("uvicorn.error")

class FAISSService:
    def __init__(self):
        self._client = None
        self._index = None
        self._lock = threading.Lock()
        
        self._persist_dir = settings.FAISS_PERSIST_DIR
        self._index_name = settings.FAISS_INDEX_NAME
        self._store_path = os.path.join(self._persist_dir, f"{self._index_name}_store.pkl")
        self._dimension = settings.EMBEDDING_DIMENSION  # 384 for MiniLM
        
        self._store: Dict[str, Dict[str, Any]] = {}  # chunk_id -> {"vector": List[float], "payload": Dict}
        self._index_mapping: List[str] = []         # position i -> chunk_id
        
        self._available = False
        self._connect()

    def _connect(self):
        try:
            import faiss
            os.makedirs(self._persist_dir, exist_ok=True)
            self._load_store()
            self._rebuild_index()
            self._available = True
            logger.info(f"[FAISS] Initialized persistent vector database in: {self._persist_dir}")
        except ImportError:
            logger.error("[FAISS] faiss-cpu not installed. Run: pip install faiss-cpu")
            self._available = False
        except Exception as exc:
            logger.warning(f"[FAISS] Initialization failed ({exc}). Vector retrieval will be unavailable.")
            self._available = False

    def _load_store(self):
        """Load persistent pickle store from disk if it exists."""
        if os.path.exists(self._store_path):
            try:
                with open(self._store_path, "rb") as f:
                    self._store = pickle.load(f)
                logger.info(f"[FAISS] Loaded {len(self._store)} vectors from metadata store file.")
            except Exception as e:
                logger.error(f"[FAISS] Failed to load metadata store file: {e}", exc_info=True)
                self._store = {}
        else:
            self._store = {}

    def _save_store(self):
        """Save persistent pickle store to disk."""
        try:
            with open(self._store_path, "wb") as f:
                pickle.dump(self._store, f)
        except Exception as e:
            logger.error(f"[FAISS] Failed to save metadata store file: {e}", exc_info=True)

    def _rebuild_index(self):
        """Rebuild the FAISS index from the memory store. Thread-safe."""
        import faiss
        
        # Define flat IP index (cosine similarity for L2-normalized vectors)
        self._index = faiss.IndexFlatIP(self._dimension)
        self._index_mapping = []

        if not self._store:
            logger.info("[FAISS] Vector store is empty. Empty index initialized.")
            return

        vectors = []
        for chunk_id, data in self._store.items():
            vec = data["vector"]
            # Ensure the vector size matches settings
            if len(vec) != self._dimension:
                logger.warning(f"[FAISS] Vector dimension mismatch for '{chunk_id}': expected {self._dimension}, got {len(vec)}. Skipping.")
                continue
            
            # Normalize vector for Cosine Similarity (IP search)
            arr = np.array(vec, dtype=np.float32)
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
                
            vectors.append(arr)
            self._index_mapping.append(chunk_id)

        if vectors:
            vectors_np = np.vstack(vectors)
            self._index.add(vectors_np)
            logger.info(f"[FAISS] Rebuilt index with {self._index.ntotal} vectors.")
        else:
            logger.info("[FAISS] No valid vectors found. Index contains 0 elements.")

    def ensure_collection(self) -> bool:
        """FAISS manages collection implicitly on startup/updates."""
        return self._available

    def upsert_chunks(self, chunks: List[Dict[str, Any]]) -> bool:
        if not self._available:
            logger.warning("[FAISS] upsert_chunks() skipped — FAISS unavailable.")
            return False

        if not chunks:
            return True

        with self._lock:
            try:
                for chunk in chunks:
                    vector = chunk.get("vector")
                    payload = chunk.get("payload", {})
                    chunk_id = payload.get("chunk_id") or str(uuid.uuid4())

                    if not vector:
                        logger.warning(f"[FAISS] Skipping chunk '{chunk_id}' — no vector.")
                        continue

                    # Chroma compatibility cleaning: ensure values are primitive types
                    clean_payload = {}
                    for k, v in payload.items():
                        if v is None:
                            clean_payload[k] = ""
                        elif isinstance(v, (str, int, float, bool)):
                            clean_payload[k] = v
                        else:
                            clean_payload[k] = str(v)

                    self._store[chunk_id] = {
                        "vector": vector,
                        "payload": clean_payload
                    }

                self._save_store()
                self._rebuild_index()
                logger.info(f"[FAISS] Upserted {len(chunks)} chunks into store and rebuilt index.")
                return True
            except Exception as exc:
                logger.error(f"[FAISS] upsert_chunks() failed: {exc}", exc_info=True)
                return False

    def search(
        self,
        query_vector: List[float],
        top_k: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        score_threshold: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        if not self._available or self._index is None or self._index.ntotal == 0:
            return []

        # Default score threshold
        threshold = score_threshold if score_threshold is not None else settings.RAG_MIN_SCORE

        with self._lock:
            try:
                # 1. Normalize query vector
                q_arr = np.array(query_vector, dtype=np.float32)
                q_norm = np.linalg.norm(q_arr)
                if q_norm > 0:
                    q_arr = q_arr / q_norm

                # 2. Retrieve candidates (fetch more than top_k to support post-filtering)
                search_k = min(self._index.ntotal, max(top_k * 5, 100))
                scores, indices = self._index.search(np.array([q_arr], dtype=np.float32), search_k)

                formatted_results = []
                for score, idx in zip(scores[0], indices[0]):
                    if idx < 0 or idx >= len(self._index_mapping):
                        continue
                    
                    chunk_id = self._index_mapping[idx]
                    chunk_data = self._store.get(chunk_id)
                    if not chunk_data:
                        continue

                    payload = chunk_data["payload"]

                    # 3. Post-filtering by metadata
                    match = True
                    if filters:
                        for k, v in filters.items():
                            if v and payload.get(k) != v:
                                match = False
                                break
                    if not match:
                        continue

                    # 4. Filter by score threshold
                    # Since query and index vectors are normalized, inner product score = Cosine Similarity
                    similarity = float(score)
                    if similarity >= threshold:
                        formatted_results.append({
                            "id": chunk_id,
                            "score": similarity,
                            "payload": payload
                        })

                    # Break early if we filled our quota
                    if len(formatted_results) >= top_k:
                        break

                return formatted_results

            except Exception as exc:
                logger.error(f"[FAISS] search() failed: {exc}", exc_info=True)
                return []

    def delete_by_document_id(self, document_id: str) -> bool:
        if not self._available:
            return False

        with self._lock:
            try:
                # Find all chunk IDs associated with document_id
                to_delete = []
                for chunk_id, data in self._store.items():
                    if data.get("payload", {}).get("document_id") == document_id:
                        to_delete.append(chunk_id)

                if not to_delete:
                    return True

                for chunk_id in to_delete:
                    self._store.pop(chunk_id, None)

                self._save_store()
                self._rebuild_index()
                logger.info(f"[FAISS] Deleted {len(to_delete)} chunks for document_id='{document_id}'.")
                return True
            except Exception as exc:
                logger.error(f"[FAISS] delete_by_document_id() failed: {exc}", exc_info=True)
                return False

    def is_available(self) -> bool:
        return self._available

    def get_collection_info(self) -> Dict[str, Any]:
        if not self._available or self._index is None:
            return {"status": "unavailable"}
        try:
            count = self._index.ntotal
            return {
                "status": "connected",
                "collection": self._index_name,
                "vectors_count": count,
                "points_count": count,
            }
        except Exception:
            return {"status": "collection_missing"}

_faiss_service: Optional[FAISSService] = None

def get_faiss_service() -> FAISSService:
    global _faiss_service
    if _faiss_service is None:
        _faiss_service = FAISSService()
    return _faiss_service
