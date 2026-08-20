import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load env variables from root .env or local environment
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))


class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicSync AI Backend"

    # ── Firebase ──────────────────────────────────────────────────────────────
    FIREBASE_PROJECT_ID: str = "civic-sync-cosmic"
    FIREBASE_STORAGE_BUCKET: str = "civic-sync-cosmic.appspot.com"

    # ── Gemini AI (optional — legacy fallback) ────────────────────────────────
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # ── Groq (optional — fallback LLM) ───────────────────────────────────────
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # ── Ollama (primary local LLM) ────────────────────────────────────────────
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen3:8b")
    OLLAMA_TIMEOUT: int = int(os.getenv("OLLAMA_TIMEOUT", "120"))

    # ── AI Provider Selection ─────────────────────────────────────────────────
    # Primary provider: "ollama" | "groq" | "gemini"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")
    # Fallback if primary fails: "groq" | "gemini" | "" (no fallback)
    AI_FALLBACK_PROVIDER: str = os.getenv("AI_FALLBACK_PROVIDER", "groq")

    # ── Embedding Model ───────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    # MiniLM outputs 384-dimensional dense vectors
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))

    # ── FAISS Vector Database ──────────────────────────────────────────────────
    FAISS_PERSIST_DIR: str = os.getenv(
        "FAISS_PERSIST_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "faiss")
    )
    FAISS_INDEX_NAME: str = os.getenv("FAISS_INDEX_NAME", "civicsync_knowledge")

    # ── RAG Retrieval Config ──────────────────────────────────────────────────
    # Initial retrieval pool size
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "20"))
    # Final chunks after reranking
    RAG_FINAL_K: int = int(os.getenv("RAG_FINAL_K", "5"))
    # Minimum similarity score to include a chunk
    RAG_MIN_SCORE: float = float(os.getenv("RAG_MIN_SCORE", "0.35"))

    # ── Reranking ─────────────────────────────────────────────────────────────
    RERANK_ENABLED: bool = os.getenv("RERANK_ENABLED", "true").lower() == "true"
    RERANK_MODEL: str = os.getenv("RERANK_MODEL", "BAAI/bge-reranker-v2-m3")

    # ── Chunking Config ───────────────────────────────────────────────────────
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))

    # ── File upload settings ──────────────────────────────────────────────────
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    )

    # ── CORS origins ──────────────────────────────────────────────────────────
    CLIENT_URL: str = os.getenv("CLIENT_URL", "http://localhost:5173")

    class Config:
        case_sensitive = True


settings = Settings()
