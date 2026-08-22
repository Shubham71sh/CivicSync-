"""
Document Ingestion Pipeline.

Handles:
1. Cleaning text.
2. Generating BGE-M3 embeddings.
3. Storing chunks in ChromaDB.
4. Setting indexing status in Firestore.
5. Reindexing all documents from Firestore.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import pypdf

from app.config.settings import settings
from app.config.database import get_col
from app.ai.embeddings.bge_m3 import get_embedding_service
from app.ai.retrieval.chroma_client import get_chroma_service
from app.ai.ingestion.chunking_service import chunk_text, chunk_text_with_pages

logger = logging.getLogger("uvicorn.error")


async def index_document(
    document_id: str,
    text: str,
    metadata: Dict[str, Any],
    pages: Optional[List[dict]] = None,
) -> Dict[str, Any]:
    """
    Index a single document (bill/scheme/policy etc) into ChromaDB.

    Args:
        document_id: ID of the document (matching Firestore/Storage filename key)
        text: Full extracted text of the document
        metadata: Metadata details including:
                  - title: str
                  - document_type: str ("bill"|"scheme"|"policy"|"loan"|"insurance" etc)
                  - source: str (link/reference)
                  - state: str (state target)
                  - category: str
                  - firebase_id: str (Firestore record id)
        pages: Optional list of {"page_num": int, "text": str} to preserve page numbers.

    Returns:
        Dict detailing the index status.
    """
    logger.info(f"[Ingestion] Indexing document {document_id} of type {metadata.get('document_type')}")
    loop = asyncio.get_event_loop()

    # Create/update indexing status in Firestore (set to processing)
    def _update_status(status: str, doc_info: dict):
        try:
            doc_ref = get_col("bills").document(document_id)
            if doc_ref.get().exists:
                doc_ref.update({
                    "index_status": status,
                    **doc_info
                })
            else:
                # Might be a scheme or other type of document
                # Let's try writing to schemes or custom status
                pass
        except Exception as e:
            logger.warning(f"Could not update indexing status in Firestore: {e}")

    _update_status("processing", {
        "chunk_count": 0,
        "indexed_at": None,
        "embedding_model": settings.EMBEDDING_MODEL,
        "chroma_collection": settings.CHROMA_COLLECTION
    })

    try:
        # Step 1: Chunking
        if pages:
            page_tuples = [(p.get("page_num", 0), p.get("text", "")) for p in pages]
            chunks = chunk_text_with_pages(page_tuples)
        else:
            chunks = chunk_text(text)

        if not chunks:
            raise ValueError("No valid chunks created from the document text.")

        logger.info(f"[Ingestion] Document split into {len(chunks)} chunks.")

        # Step 2: Embedding Generation
        embedding_svc = get_embedding_service()
        chunk_texts = [c.text for c in chunks]
        
        # Run BGE-M3 model inference in executor (it blocks the event loop)
        vectors = await loop.run_in_executor(
            None,
            embedding_svc.embed_documents,
            chunk_texts
        )

        # Step 3: Prepare payloads and upsert to ChromaDB
        chroma_svc = get_chroma_service()
        chroma_svc.ensure_collection()

        # Clear any existing chunks for this document_id first (idempotent re-indexing)
        chroma_svc.delete_by_document_id(document_id)

        upsert_payloads = []
        now_str = datetime.now(timezone.utc).isoformat()
        
        for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
            payload = {
                "document_id": document_id,
                "chunk_id": f"{document_id}_{chunk.section.lower().replace(' ', '_')}_{i:03d}" if chunk.section else f"{document_id}_chunk_{i:03d}",
                "document_type": metadata.get("document_type", "bill"),
                "title": metadata.get("title", "Untitled Document"),
                "source": metadata.get("source", ""),
                "source_type": metadata.get("source_type", "official"),
                "source_url": metadata.get("source_url") or metadata.get("source", ""),
                "last_verified_at": metadata.get("last_verified_at", now_str),
                "page": chunk.page or 1,
                "section": chunk.section or "Document",
                "language": metadata.get("language", "en"),
                "state": metadata.get("state", "All States"),
                "category": metadata.get("category", "General"),
                "text": chunk.text,
                "firebase_id": metadata.get("firebase_id", document_id),
                "created_at": now_str
            }
            upsert_payloads.append({
                "vector": vector,
                "payload": payload
            })

        # Upsert
        success = chroma_svc.upsert_chunks(upsert_payloads)
        if not success:
            raise RuntimeError("Failed to upsert chunks into ChromaDB.")

        # Complete
        _update_status("completed", {
            "chunk_count": len(chunks),
            "indexed_at": now_str,
        })
        logger.info(f"[Ingestion] Successfully indexed document {document_id}.")
        return {
            "status": "success",
            "chunk_count": len(chunks),
            "indexed_at": now_str
        }

    except Exception as e:
        logger.error(f"[Ingestion] Failed to index document {document_id}: {e}", exc_info=True)
        _update_status("failed", {
            "chunk_count": 0,
            "indexed_at": datetime.now(timezone.utc).isoformat(),
            "indexing_error": str(e)
        })
        return {
            "status": "failed",
            "error": str(e)
        }


async def reindex_all_documents() -> Dict[str, Any]:
    """
    Fetch all documents from Firestore (bills, schemes, policy documents)
    and rebuild/re-index ChromaDB collection.
    """
    logger.info("[Ingestion] Starting full reindexing of all documents.")
    loop = asyncio.get_event_loop()

    # Fetch all bills from Firestore
    def _fetch_bills():
        try:
            return list(get_col("bills").stream())
        except Exception:
            return []

    # Fetch all schemes
    def _fetch_schemes():
        try:
            return list(get_col("schemes").stream())
        except Exception:
            return []

    bills = await loop.run_in_executor(None, _fetch_bills)
    schemes = await loop.run_in_executor(None, _fetch_schemes)
    
    total_indexed = 0
    failures = 0

    # Index Bills
    for bill_snapshot in bills:
        bill_data = bill_snapshot.to_dict() or {}
        bill_id = bill_snapshot.id
        text = bill_data.get("extractedText", "")
        if not text:
            logger.warning(f"[Ingestion] Bill {bill_id} has no extracted text. Skipping.")
            continue

        metadata = {
            "title": bill_data.get("title", bill_id),
            "document_type": "bill",
            "source": bill_data.get("storageUrl", ""),
            "language": "en", # Default
            "state": "All States",
            "category": "Bill",
            "firebase_id": bill_id
        }

        # Attempt to reconstruct pages if possible, or fall back to plain text
        res = await index_document(bill_id, text, metadata)
        if res.get("status") == "success":
            total_indexed += 1
        else:
            failures += 1

    # Index Schemes
    for scheme_snapshot in schemes:
        scheme_data = scheme_snapshot.to_dict() or {}
        scheme_id = scheme_snapshot.id
        
        # Extract text description
        name = scheme_data.get("name", scheme_data.get("schemeName", ""))
        desc = scheme_data.get("description", "")
        eligibility = scheme_data.get("eligibilityCriteria", scheme_data.get("eligibility", ""))
        benefits = scheme_data.get("benefits", "")
        
        # Combine scheme fields into a structured text representation for retrieval
        full_text = f"""
        Scheme Name: {name}
        Category: {scheme_data.get('category', '')}
        State: {scheme_data.get('state', '')}
        Description: {desc}
        Eligibility: {eligibility}
        Benefits: {benefits}
        Required Documents: {scheme_data.get('documentsRequired', '')}
        """

        metadata = {
            "title": name,
            "document_type": "scheme",
            "source": scheme_data.get("officialSource", ""),
            "language": "en",
            "state": scheme_data.get("state", "All States"),
            "category": scheme_data.get("category", "Subsidies"),
            "firebase_id": scheme_id
        }

        res = await index_document(scheme_id, full_text.strip(), metadata)
        if res.get("status") == "success":
            total_indexed += 1
        else:
            failures += 1

    logger.info(f"[Ingestion] Full re-indexing complete. Success: {total_indexed}, Failures: {failures}.")
    return {
        "total_indexed": total_indexed,
        "failures": failures,
        "status": "completed"
    }
