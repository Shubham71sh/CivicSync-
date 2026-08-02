from contextlib import asynccontextmanager
from typing import Any, Dict
import logging

# pyrefly: ignore [missing-import]
from fastapi import Depends, FastAPI

# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

# pyrefly: ignore [missing-import]
from pydantic import BaseModel

# ── Module 3 routers (Transparency Engine) ───────────────────────────────────
from app.api.routes import bills, compare, fake_news

# ── Module 1 routers (Citizen Portal — Firebase) ─────────────────────────────
from app.routers import (
    auth, citizen, schemes, benefits, notifications,
    roadmap, chat, gps, dashboard, analytics
)

# ── Module 4 routers (AI Finance + Scheme Notifications) ─────────────────────
from app.routers import loan_analyzer, insurance_analyzer, scheme_notifications

# ── Module 2 routers (Disaster Relief Reports) ───────────────────────────────
from app.routers import reports

# ── Firebase + seed ───────────────────────────────────────────────────────────
from app.core.firebase import get_db
from app.services.seed_service import seed_schemes

# ── Auth middleware (for profile endpoints) ───────────────────────────────────
from app.middleware.auth import get_current_user
from app.services.profile_service import ProfileService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CivicSync FastAPI backend...")
    try:
        # Initialize Firebase Admin + Firestore
        db = get_db()
        logger.info("Firebase Admin SDK initialized.")

        # Seed schemes into Firestore
        seeded = await seed_schemes()
        if seeded > 0:
            logger.info(f"Seeded {seeded} government schemes into Firestore.")
        else:
            logger.info("Schemes collection already seeded — skipping.")
    except Exception as e:
        logger.error(f"Startup error: {e}")

    yield

    logger.info("CivicSync FastAPI shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CivicSync AI Backend",
    version="4.0.0",
    description=(
        "Module 1 (Citizen Portal — Firebase) + "
        "Module 2 (Disaster Relief) + "
        "Module 3 (Transparency Engine — Gemini AI) + "
        "Module 4 (AI Loan Analyzer, AI Insurance Analyzer, Scheme Notifications)"
    ),
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


# ── Module 4 Routes (AI Finance + Scheme Notifications) ──────────────────────

app.include_router(loan_analyzer.router, prefix="/api")
app.include_router(insurance_analyzer.router, prefix="/api")
app.include_router(scheme_notifications.router, prefix="/api")


# ── Module 2 Routes (Disaster Relief) ────────────────────────────────────────
# Registered at /reports (frontend api.js calls http://127.0.0.1:8000/reports/...)

app.include_router(reports.router)


# ── Module 3 Routes (Transparency Engine) ────────────────────────────────────

app.include_router(bills.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(fake_news.router, prefix="/api")

# Legacy bare mounts (frontend hits /bills, /chat, /fake-news directly)
app.include_router(bills.router)
app.include_router(compare.router)
app.include_router(fake_news.router)

# Bare /chat endpoint — src/services/api.js calls http://127.0.0.1:8000/chat
app.include_router(chat.router)


# ── Profile Model (HEAD branch — preserved) ───────────────────────────────────

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


# ── Profile Endpoints (HEAD branch — preserved) ───────────────────────────────

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
    saved_profile = await ProfileService(get_db()).update_profile(
        current_user["_id"],
        profile.model_dump(exclude_unset=True),
        user_defaults=current_user,
    )
    logger.info("Updated civic profile for user %s", current_user["_id"])
    return {
        "message": "Profile updated successfully",
        "profile": saved_profile,
    }


# ── Root & Health ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "CivicSync Backend Running Successfully",
        "version": "3.0.0",
        "database": "Firebase Firestore",
        "auth": "Firebase Authentication",
        "modules": (
            "Module 1 (Citizen Portal) + "
            "Module 2 (Disaster Relief) + "
            "Module 3 (Transparency Engine) + "
            "Module 4 (AI Finance + Scheme Notifications)"
        ),
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "Firestore",
        "auth": "Firebase",
        "server": "running",
    }
