from contextlib import asynccontextmanager
import asyncio
from typing import Any, Dict
import logging

# ── RAG / Open-Source AI Stack ────────────────────────────────────────────────
from app.ai.retrieval.faiss_client import get_faiss_service
from app.ai.embeddings.bge_m3 import get_embedding_service
from app.ai.orchestrator import orchestrator

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

        # Initialize FAISS and warming embeddings model
        logger.info("Checking Vector Database & Embeddings Model...")
        faiss_svc = get_faiss_service()
        if faiss_svc.is_available():
            faiss_svc.ensure_collection()
            logger.info("FAISS index checks complete.")
        else:
            logger.warning("FAISS is not running/available. App starting in fallback mode.")

        # Trigger lazy warming of embedding model in background
        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, get_embedding_service().is_available)
        logger.info("Warming embedding model MiniLM in background...")

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
    allow_origins=["*"],
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
    return {"status": "healthy", "server": "running", "database": "Firestore"}


@app.get("/api/health/ai")
def health_ai():
    """
    Detailed health check of the active local RAG and open-source AI integrations.
    """
    faiss_svc = get_faiss_service()
    embed_svc = get_embedding_service()
    status_ai = orchestrator.status()
    
    faiss_status = "connected" if faiss_svc.is_available() else "disconnected"
    embedding_status = "loaded" if embed_svc.is_available() else "failed"
    ollama_status = "connected" if status_ai.get("primary", {}).get("available") else "disconnected"
    
    # RAG state determination
    rag_ready = "ready"
    if faiss_status != "connected" or embedding_status != "loaded":
        rag_ready = "partially_ready"
    if faiss_status == "disconnected" and embedding_status == "failed":
        rag_ready = "unavailable"

    return {
        "faiss": faiss_status,
        "embedding_model": embedding_status,
        "ollama": ollama_status,
        "llm_model": status_ai.get("primary", {}).get("model", "unknown"),
        "rag": rag_ready,
        "fallback_provider": status_ai.get("fallback", {}).get("name", "none"),
        "fallback_status": "connected" if status_ai.get("fallback", {}).get("available") else "disconnected"
    }
