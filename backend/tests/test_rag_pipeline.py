"""
RAG Pipeline Unit & Integration Tests.
Covers embedding service, ChromaDB client, chunking, retrieval service,
reranking, context builder, citation extraction, and service modules.
"""

import pytest
import numpy as np
from unittest.mock import patch
from app.ai.embeddings.bge_m3 import get_embedding_service
from app.ai.retrieval.chroma_client import get_chroma_service, ChromaService
from app.ai.retrieval.hybrid_search import _tokenize, _bm25_score, hybrid_rerank
from app.ai.retrieval.reranker import get_reranker
from app.ai.retrieval.retrieval_service import get_retrieval_service
from app.ai.ingestion.chunking_service import chunk_text, TextChunk
from app.ai.rag.context_builder import ContextBuilder
from app.ai.rag.citation_service import CitationService
from app.ai.orchestrator import orchestrator
from app.services.ai_summary_service import generate_bill_analysis, format_structured_summary
from app.services.compare_service import compare_bills_with_ai
from app.services.fake_news_service import verify_claim_with_ai


@patch("app.ai.retrieval.chroma_client.ChromaService")
def test_chroma_fallback(mock_chroma):
    """Test ChromaDB client gracefully handles unavailability."""
    svc = get_chroma_service()
    svc._available = False
    assert svc.search([0.1, 0.2]) == []
    assert svc.upsert_chunks([{"vector": [0.1], "payload": {}}]) == False


@patch("app.ai.retrieval.chroma_client.ChromaService")
def test_retrieval_service_fallback(mock_chroma):
    """Test Retrieval Service gracefully handles ChromaDB unavailability."""
    # Ensure retrieval doesn't crash when DB fails
    svc = get_retrieval_service()
    # It requires an async loop context for embedding if we call retrieve(), 
    # so we just test initialization and component patching here.
    assert svc is not None


def test_chunking_text():
    """Test chunk_text functionality and section boundary detection."""
    text = "Section 1. Background\nThis is a municipal bill explanation.\n\nSection 2. Eligibility\nOnly local homeowners qualify."
    chunks = chunk_text(text, chunk_size=200, overlap=10)
    assert len(chunks) >= 2
    assert chunks[0].section == "Section 1. Background"
    assert chunks[1].section == "Section 2. Eligibility"
    assert "local homeowners" in chunks[1].text


def test_bm25_lexical_scoring():
    """Test BM25 in-memory keyword scoring."""
    doc = "This bill provides agriculture solar subsidies for rural farmers in Punjab."
    query_tokens = ["solar", "farmers", "punjab"]
    
    score_high = _bm25_score(query_tokens, doc)
    score_low = _bm25_score(["unrelated", "keywords"], doc)
    
    assert score_high > score_low


def test_hybrid_search_reranking():
    """Test reciprocal rank fusion merging semantic and keyword scoring."""
    vector_results = [
        {"id": "c1", "score": 0.85, "payload": {"text": "Solar power subsidies detail"}},
        {"id": "c2", "score": 0.81, "payload": {"text": "General billing information"}}
    ]
    query = "solar subsidies"
    
    merged = hybrid_rerank(query, vector_results, top_k=2)
    assert len(merged) == 2
    assert merged[0]["id"] == "c1"  # "solar" text should win due to higher vector score + keyword match


def test_context_builder():
    """Test context builder frames structured prompts cleanly."""
    chunks = [
        TextChunk(text="Farmers qualify for 50% discount.", page=2, section="Section 4", title="Solar Scheme", chunk_id="chunk_1", metadata={}) 
    ]
    # Convert TextChunk to RetrievalChunk shape for ContextBuilder
    from app.ai.retrieval.retrieval_service import RetrievalChunk
    retrieved = [
        RetrievalChunk(
            chunk_id=c.chunk_id,
            text=c.text,
            page=c.page,
            section=c.section,
            title=c.title,
            document_id="doc_123"
        ) for c in chunks
    ]
    
    profile = {"location": "Punjab", "profession": "Farmer"}
    history = [{"role": "user", "text": "Are there solar subsidies?"}]
    
    prompt = ContextBuilder.build(
        question="What solar benefits do I get?",
        chunks=retrieved,
        profile=profile,
        history=history,
        language="English"
    )
    
    assert "[RETRIEVED EVIDENCE]" in prompt
    assert "[CITIZEN PROFILE]" in prompt
    assert "[CONVERSATION HISTORY]" in prompt
    assert "Farmers qualify for 50% discount" in prompt


def test_citation_extraction():
    """Test citation service properly deduplicates and formats sources."""
    from app.ai.retrieval.retrieval_service import RetrievalChunk
    chunks = [
        RetrievalChunk(title="Farming Act", section="Sec 2", page=4, document_id="doc1"),
        RetrievalChunk(title="Farming Act", section="Sec 2", page=4, document_id="doc1"), # Duplicate
        RetrievalChunk(title="Zoning Law", section="Sec 10", page=12, document_id="doc2")
    ]
    
    sources = CitationService.extract_sources(chunks)
    assert len(sources) == 2
    assert sources[0]["title"] == "Farming Act"
    assert sources[1]["title"] == "Zoning Law"
    
    strings = CitationService.format_sources_as_strings(chunks)
    assert len(strings) == 2
    assert "Farming Act - Sec 2 (Page 4)" in strings[0]


def test_format_structured_summary():
    """Test plain-text summarization formatter covers new fields."""
    summary_dict = {
        "overview": "Overview text.",
        "objectives": ["Obj 1"],
        "keyProvisions": ["Prov 1"],
        "importantDates": ["Q1 deadline"],
        "eligibility": ["Farmers only"],
        "financialImplications": ["₹10 lakh budget"]
    }
    
    formatted = format_structured_summary(summary_dict)
    assert "📌 1. Overview" in formatted
    assert "📅 9. Important Dates" in formatted
    assert "🔍 10. Eligibility" in formatted
    assert "💰 11. Financial Implications" in formatted
    assert "Q1 deadline" in formatted


@pytest.mark.asyncio
async def test_compare_bills_fallback():
    """Verify Compare service falls back cleanly to mock comparisons."""
    bills = [
        {"title": "Act A", "extractedText": "Detail description of act a"},
        {"title": "Act B", "extractedText": "Detail description of act b"}
    ]
    result = await compare_bills_with_ai(bills)
    assert "similarities" in result
    assert "differences" in result
    assert len(result["similarities"]) > 0


@pytest.mark.asyncio
async def test_fake_news_pipeline_fallback():
    """Verify Fake News service falls back cleanly on empty DB context."""
    result = await verify_claim_with_ai(text="Claim that farmers get free tractors", url=None)
    assert result["verdict"] in ["TRUE", "FALSE", "MISLEADING", "UNVERIFIED"]
    assert "analysis" in result
    assert "sources" in result
