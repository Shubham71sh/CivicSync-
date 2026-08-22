"""
Chroma Vector Database Service.

Manages the 'civicsync_knowledge' collection locally using PersistentClient.

Features:
- Auto-creates collection if it does not exist
- Upsert chunks with full metadata payloads
- Semantic search with optional metadata filters
- Delete by document_id (for re-indexing)
- Graceful degradation: all methods return safe values if Chroma unavailable
"""

import logging
import uuid
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.config.settings import settings

logger = logging.getLogger("uvicorn.error")

class ChromaService:
    def __init__(self):
        self._client = None
        self._collection = None
        self._collection_name = settings.CHROMA_COLLECTION
        self._persist_dir = settings.CHROMA_PERSIST_DIR
        self._available = False
        self._connect()

    def _connect(self):
        try:
            import chromadb
            
            # Ensure the directory exists
            os.makedirs(self._persist_dir, exist_ok=True)
            
            self._client = chromadb.PersistentClient(path=self._persist_dir)
            
            # Simple heartbeat
            self._client.heartbeat()
            self._available = True
            logger.info(f"[ChromaDB] Connected to persistent directory: {self._persist_dir}")
        except ImportError:
            logger.error("[ChromaDB] chromadb not installed. Run: pip install chromadb")
            self._available = False
        except Exception as exc:
            logger.warning(f"[ChromaDB] Connection failed ({exc}). Vector retrieval will be unavailable.")
            self._available = False

    def ensure_collection(self) -> bool:
        if not self._available or self._client is None:
            return False

        try:
            # get_or_create_collection with cosine space
            self._collection = self._client.get_or_create_collection(
                name=self._collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"[ChromaDB] Ensured collection '{self._collection_name}' exists (space=cosine).")
            return True
        except Exception as exc:
            logger.error(f"[ChromaDB] ensure_collection() failed: {exc}", exc_info=True)
            return False

    def upsert_chunks(self, chunks: List[Dict[str, Any]]) -> bool:
        if not self._available or self._collection is None:
            logger.warning("[ChromaDB] upsert_chunks() skipped — Chroma unavailable or collection missing.")
            return False

        if not chunks:
            return True

        try:
            ids = []
            embeddings = []
            metadatas = []
            documents = []

            for chunk in chunks:
                vector = chunk.get("vector")
                payload = chunk.get("payload", {})
                chunk_id = payload.get("chunk_id") or str(uuid.uuid4())

                if not vector:
                    logger.warning(f"[ChromaDB] Skipping chunk '{chunk_id}' — no vector.")
                    continue

                ids.append(chunk_id)
                embeddings.append(vector)
                
                # Chroma metadata values can only be str, int, float, bool.
                clean_payload = {}
                for k, v in payload.items():
                    if v is None:
                        clean_payload[k] = ""
                    elif isinstance(v, (str, int, float, bool)):
                        clean_payload[k] = v
                    else:
                        clean_payload[k] = str(v)
                
                metadatas.append(clean_payload)
                documents.append(payload.get("text", ""))

            if not ids:
                return True

            self._collection.upsert(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            
            logger.info(f"[ChromaDB] Upserted {len(ids)} chunks into '{self._collection_name}'.")
            return True
        except Exception as exc:
            logger.error(f"[ChromaDB] upsert_chunks() failed: {exc}", exc_info=True)
            return False

    def search(
        self,
        query_vector: List[float],
        top_k: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        score_threshold: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        if not self._available or self._collection is None:
            logger.warning("[ChromaDB] search() skipped — Chroma unavailable.")
            return []

        try:
            chroma_filter = None
            if filters:
                valid_filters = {k: v for k, v in filters.items() if v}
                if len(valid_filters) == 1:
                    chroma_filter = valid_filters
                elif len(valid_filters) > 1:
                    chroma_filter = {"$and": [{k: v} for k, v in valid_filters.items()]}
                    
            threshold = score_threshold if score_threshold is not None else settings.RAG_MIN_SCORE

            results = self._collection.query(
                query_embeddings=[query_vector],
                n_results=top_k,
                where=chroma_filter,
                include=["metadatas", "distances"]
            )
            
            if not results["ids"] or not results["ids"][0]:
                return []
                
            formatted_results = []
            for i in range(len(results["ids"][0])):
                id_ = results["ids"][0][i]
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 1.0
                
                # Chroma cosine space returns distance = 1 - cosine_similarity.
                similarity = 1.0 - distance
                
                if similarity >= threshold:
                    formatted_results.append({
                        "id": id_,
                        "score": similarity,
                        "payload": metadata
                    })
                    
            return formatted_results

        except Exception as exc:
            logger.error(f"[ChromaDB] search() failed: {exc}", exc_info=True)
            return []

    def delete_by_document_id(self, document_id: str) -> bool:
        if not self._available or self._collection is None:
            return False

        try:
            self._collection.delete(
                where={"document_id": document_id}
            )
            logger.info(f"[ChromaDB] Deleted chunks for document_id='{document_id}'.")
            return True
        except Exception as exc:
            logger.error(f"[ChromaDB] delete_by_document_id() failed: {exc}", exc_info=True)
            return False

    def is_available(self) -> bool:
        return self._available

    def get_collection_info(self) -> Dict[str, Any]:
        if not self._available or self._collection is None:
            return {"status": "unavailable"}
        try:
            count = self._collection.count()
            return {
                "status": "connected",
                "collection": self._collection_name,
                "vectors_count": count,
                "points_count": count,
            }
        except Exception:
            return {"status": "collection_missing"}

_chroma_service: Optional[ChromaService] = None

def get_chroma_service() -> ChromaService:
    global _chroma_service
    if _chroma_service is None:
        _chroma_service = ChromaService()
    return _chroma_service
