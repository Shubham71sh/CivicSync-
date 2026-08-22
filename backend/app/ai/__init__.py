"""
CivicSync AI Stack
==================
Production-style multilingual RAG architecture.

Modules:
  providers/   — LLM provider abstraction (Ollama, Groq, Gemini)
  embeddings/  — BGE-M3 embedding service (singleton)
  retrieval/   — Qdrant vector DB client + hybrid search + reranker
  ingestion/   — Document chunking + indexing pipeline
  rag/         — RAG service, context builder, citation service
  orchestrator — Central AI orchestrator
"""
