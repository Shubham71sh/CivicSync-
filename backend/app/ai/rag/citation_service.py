"""
Citation Service.

Extracts and formats source citations from retrieved evidence chunks.
Used to supply structured evidence sources to the API response.
"""

from typing import Any, Dict, List
from app.ai.retrieval.retrieval_service import RetrievalChunk


class CitationService:
    """
    Helps organize and format document citations for RAG responses.
    """

    @staticmethod
    def extract_sources(chunks: List[RetrievalChunk]) -> List[Dict[str, Any]]:
        """
        Extract unique structured sources from chunks.
        
        Returns:
            List of dicts with title, section, page, and document_id.
        """
        seen = set()
        sources = []

        for chunk in chunks:
            # Create a unique key for deduplication
            key = (chunk.document_id, chunk.page, chunk.section)
            if key in seen:
                continue
            seen.add(key)

            sources.append({
                "title": chunk.title or "Uploaded Document",
                "section": chunk.section or "General",
                "page": chunk.page or 1,
                "document_id": chunk.document_id
            })

        return sources

    @staticmethod
    def format_sources_as_strings(chunks: List[RetrievalChunk]) -> List[str]:
        """
        Legacy text format helper to mirror old RAGService.get_sources().
        """
        sources = []
        seen = set()
        for chunk in chunks:
            title = chunk.title or "Document"
            # Deduplicate by title
            if title in seen:
                continue
            seen.add(title)

            page_str = f" (Page {chunk.page})" if chunk.page else ""
            sec_str = f" - {chunk.section}" if chunk.section else ""
            
            if chunk.source:
                sources.append(f"{title}{sec_str}{page_str} — {chunk.source}")
            else:
                sources.append(f"{title}{sec_str}{page_str}")

        return sources
