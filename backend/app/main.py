from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Module 3 routers (Transparency Engine — unchanged) ──────────────────────
from app.api.routes import bills, compare, fake_news

# ── Module 1 routers (ported from Node backend) ──────────────────────────────
from app.routers import auth, citizen, schemes, benefits, notifications, roadmap, chat, gps, dashboard, analytics

# ── Module 2 routers (Disaster Relief Reports) ───────────────────────────────
from app.routers import reports

# Firebase + seed
from app.core.firebase import get_db
from app.services.seed_service import seed_schemes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 CivicSync FastAPI starting up...")
    try:
        # Initialize Firebase Admin + Firestore
        db = get_db()
        logger.info("✅ Firebase Admin SDK initialized.")

        # Seed schemes into Firestore
        seeded = await seed_schemes()
        if seeded > 0:
            logger.info(f"✅ Seeded {seeded} government schemes into Firestore.")
        else:
            logger.info("✅ Schemes collection already seeded — skipping.")
    except Exception as e:
        logger.error(f"⚠️  Startup error: {e}")

    yield

    logger.info("🛑 CivicSync FastAPI shutting down...")


app = FastAPI(
    title="CivicSync AI Backend",
    version="3.0.0",
    description="Module 1 (Citizen Portal — Firebase) + Module 2 (Disaster Relief) + Module 3 (Transparency Engine — Gemini AI)",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Module 1 Routes ──────────────────────────────────────────────────────────
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

# ─── Module 2 Routes (Disaster Relief) ───────────────────────────────────────
# Registered at root /reports (frontend calls http://127.0.0.1:8000/reports/...)
app.include_router(reports.router)

# ─── Module 3 Routes (Transparency Engine) ────────────────────────────────────
app.include_router(bills.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(fake_news.router, prefix="/api")

# Legacy mounts without prefix (for backward compat with frontend that hits /bills /chat directly)
app.include_router(bills.router)
app.include_router(compare.router)
app.include_router(fake_news.router)

# Bare /chat endpoint for src/services/api.js which calls http://127.0.0.1:8000/chat
app.include_router(chat.router)


@app.get("/")
def root():
    return {
        "message": "🚀 CivicSync Backend Running Successfully",
        "version": "3.0.0",
        "database": "Firebase Firestore",
        "auth": "Firebase Authentication",
        "modules": "Module 1 (Citizen Portal) + Module 2 (Disaster Relief) + Module 3 (Transparency Engine)",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "database": "Firestore", "auth": "Firebase"}