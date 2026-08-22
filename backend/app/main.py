import sys
import os

_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from contextlib import asynccontextmanager
from typing import Any, Dict
import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Firebase / Firestore ──────────────────────────────────────────────────────
from app.core.firebase import get_db
from app.services.seed_service import seed_schemes

# ── Module 3 routers (Transparency Engine) ───────────────────────────────────
from app.api.routes import bills, compare, fake_news
from app.api.routes import chat as chat_route

# ── Module 2 routers (Disaster Relief Reports) ───────────────────────────────
from app.routers import reports

# ── Module 2 RAG (Disaster Relief RAG — isolated, does not touch AI Chat) ────
from app.routers import disaster_rag
from app.services.seed_disaster_rag import seed_disaster_rag_knowledge

# ── Module 1 routers ─────────────────────────────────────────────────────────
from app.routers import (
    auth, citizen, schemes, benefits, notifications,
    roadmap, chat, gps, dashboard, analytics,
    disaster_schemes, loan_analyzer, insurance_analyzer,
    scheme_notifications,
)

# ── Auth middleware ───────────────────────────────────────────────────────────
from app.middleware.auth import get_current_user
from app.services.profile_service import ProfileService

# Translation route (optional)
try:
    from app.api.routes import translation
    _has_translation = True
except Exception:
    _has_translation = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    import threading
    import time as _time

    logger.info("Starting CivicSync backend...")
    try:
        db = get_db()
        if db is None:
            raise RuntimeError("Firestore returned None.")
        logger.info("Firebase + Firestore connected.")

        seeded = await seed_schemes()
        if seeded > 0:
            logger.info(f"Seeded {seeded} government schemes.")
        else:
            logger.info("Schemes already seeded.")

        # Seed Disaster Relief RAG knowledge base (isolated collection)
        rag_seeded = await seed_disaster_rag_knowledge()
        if rag_seeded > 0:
            logger.info(f"[DisasterRAG] Seeded {rag_seeded} knowledge chunks.")

        # Fire-and-forget daemon thread: loads MiniLM model + FAISS index in background.
        # Server starts accepting requests IMMEDIATELY — no blocking.
        # First RAG request arriving before warmup finishes triggers lazy singleton load.
        def _warmup_rag():
            try:
                from rag.embeddings import get_embedding_model
                from rag.vector_store import get_vector_store
                t0 = _time.time()
                logger.info("[Warmup] Loading MiniLM all-MiniLM-L6-v2 model...")
                get_embedding_model()
                logger.info(f"[Warmup] MiniLM model loaded in {_time.time() - t0:.2f}s")
                t1 = _time.time()
                logger.info("[Warmup] Loading FAISS vector index...")
                store = get_vector_store()
                n = len(store.metadata)
                logger.info(f"[Warmup] FAISS index loaded with {n} chunks in {_time.time() - t1:.2f}s")
                logger.info(f"[Warmup] RAG warmup complete. Total: {_time.time() - t0:.2f}s")
            except Exception as exc:
                logger.warning(f"[Warmup] RAG warmup error (non-fatal): {exc}")

        warmup_thread = threading.Thread(target=_warmup_rag, daemon=True, name="rag-warmup")
        warmup_thread.start()
        logger.info("[Lifespan] RAG warmup launched in background thread. Server is ready.")

    except Exception as e:
        logger.critical(f"Startup error: {e}", exc_info=True)
        raise
    yield
    logger.info("CivicSync backend shutting down.")




# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CivicSync AI Backend",
    version="4.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Module 1 Routes ───────────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/api")
app.include_router(citizen.router, prefix="/api")
app.include_router(schemes.router, prefix="/api")
app.include_router(benefits.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(gps.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(loan_analyzer.router, prefix="/api")
app.include_router(insurance_analyzer.router, prefix="/api")
app.include_router(scheme_notifications.router, prefix="/api")

# ── Module 3 Routes (Transparency Engine + AI Chat) ──────────────────────────

app.include_router(bills.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(fake_news.router, prefix="/api")
app.include_router(chat_route.router, prefix="/api")

# Legacy bare mounts
app.include_router(bills.router)
app.include_router(compare.router)
app.include_router(fake_news.router)
app.include_router(chat_route.router)

if _has_translation:
    app.include_router(translation.router, prefix="/api")
    app.include_router(translation.router)

# ── Module 2 Routes (Disaster Relief) ────────────────────────────────────────

app.include_router(reports.router)
app.include_router(disaster_schemes.router)
app.include_router(disaster_rag.router)  # Disaster Relief RAG — Steps 5-8


# ── Profile Model ─────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    dob: str = ""
    profession: str = ""
    income: str = ""
    employmentStatus: str = ""
    householdSize: str = ""
    category: str = ""
    disabilityStatus: str = ""
    veteranStatus: str = ""
    studentStatus: str = ""


# ── Profile Endpoints ─────────────────────────────────────────────────────────

@app.get("/profile")
@app.get("/api/profile")
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return await ProfileService(get_db()).get_profile(
        current_user["_id"],
        user_defaults=current_user,
    )


@app.put("/profile")
@app.put("/api/profile")
async def update_profile(
    profile: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    saved = await ProfileService(get_db()).update_profile(
        current_user["_id"],
        profile.model_dump(exclude_unset=True),
        user_defaults=current_user,
    )
    return {"message": "Profile updated successfully", "profile": saved}


# ── Root & Health ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "CivicSync Backend Running Successfully",
        "version": "4.0.0",
        "database": "Firebase Firestore",
    }


@app.get("/health")
def health():
    """
    Health check endpoint.  Includes real AI/RAG service status so the
    frontend can show an honest 'AI Online / AI Offline' indicator.
    """
    from rag.embeddings import _model_instance, _use_fallback, HAS_SENTENCE_TRANSFORMERS
    from rag.vector_store import _vector_store_instance

    # Real AI service status — based on actual singleton state
    rag_model_loaded   = (_model_instance is not None) and (not _use_fallback)
    faiss_index_loaded = (
        _vector_store_instance is not None
        and (
            _vector_store_instance.index is not None
            or _vector_store_instance.vectors is not None
        )
    )
    gemini_key_set = bool(os.getenv("GEMINI_API_KEY", "").strip())

    ai_status = "online" if (rag_model_loaded and faiss_index_loaded and gemini_key_set) else (
        "warming_up" if (HAS_SENTENCE_TRANSFORMERS and not rag_model_loaded) else "offline"
    )

    return {
        "status":              "healthy",
        "server":              "running",
        "database":            "Firestore",
        "ai_status":           ai_status,          # "online" | "warming_up" | "offline"
        "rag_model_loaded":    rag_model_loaded,
        "faiss_index_loaded":  faiss_index_loaded,
        "gemini_configured":   gemini_key_set,
    }
