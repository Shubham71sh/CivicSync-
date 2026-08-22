"""
Vector RAG Service.

Combines retrieval and orchestrator generation to answer user queries using Qdrant evidence.
"""

import logging
from typing import Any, Dict, List, Optional

from app.ai.retrieval.retrieval_service import get_retrieval_service, RetrievalResult
from app.ai.rag.context_builder import ContextBuilder
from app.ai.rag.citation_service import CitationService
from app.ai.orchestrator import orchestrator

logger = logging.getLogger("uvicorn.error")


class VectorRAGService:
    """
    RAG service leveraging BGE-M3, Qdrant, and Ollama/fallback provider.
    """

    def __init__(self):
        self.retrieval_service = get_retrieval_service()

    async def answer_question(
        self,
        question: str,
        profile: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        document_type: Optional[str] = None,
        language: str = "English",
        state_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retrieves relevant documents, builds prompt, and generates answer.

        Args:
            question: The user's prompt message.
            profile: Optional citizen profile dict.
            conversation_history: Optional list of past chat turns.
            document_type: Optional filter for document type.
            language: Target response language.
            state_filter: Optional filter for geographic state.

        Returns:
            Dict containing:
                "answer": str
                "sources": list of dicts/strings
                "confidence": float
        """
        # Build retrieval filters
        filters = {}
        if document_type:
            filters["document_type"] = document_type
        if state_filter:
            filters["state"] = state_filter

        # Run retrieval pipeline
        retrieval_result: RetrievalResult = await self.retrieval_service.retrieve(
            query=question,
            filters=filters if filters else None
        )

        # Build prompt using context builder
        prompt = ContextBuilder.build(
            question=question,
            chunks=retrieval_result.chunks,
            profile=profile,
            history=conversation_history,
            doc_type=document_type,
            language=language
        )

        # Call generation model
        # Enforce system instruction to be helpful and objective
        system_msg = "You are a grounded civic policy expert helper. Cite source documents strictly."
        
        answer = await asyncio_run_generate(prompt, system_msg)

        # If retrieval yielded no confidence or was completely empty, update answer
        if not retrieval_result.chunks or retrieval_result.confidence < 0.1:
            answer = "I could not find enough reliable evidence in the uploaded documents to answer this question."

        # Extract citations
        sources = CitationService.extract_sources(retrieval_result.chunks)
        legacy_sources = CitationService.format_sources_as_strings(retrieval_result.chunks)

        return {
            "answer": answer,
            "sources": sources,
            "legacy_sources": legacy_sources,
            "confidence": retrieval_result.confidence,
            "retrieved_chunks_count": len(retrieval_result.chunks)
        }


async def asyncio_run_generate(prompt: str, system: str) -> str:
    """Helper to run synchronous generator asynchronously."""
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        orchestrator.generate,
        prompt,
        system
    )
