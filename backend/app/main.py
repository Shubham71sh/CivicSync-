from contextlib import asynccontextmanager
from typing import Any, Dict
import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Database (MongoDB) ────────────────────────────────────────────────────────
from app.config.database import get_db, close_db

# ── Module 3 routers (Transparency Engine) ───────────────────────────────────
from app.api.routes import bills, compare, fake_news

# ── AI Chat router ────────────────────────────────────────────────────────────
from app.api.routes import chat

# ── Module 2 routers (Disaster Relief Reports) ───────────────────────────────
from app.routers import reports

# ── Auth middleware ───────────────────────────────────────────────────────────
from app.middleware.auth import get_current_user
from app.services.profile_service import ProfileService

# Translation route (optional - skip if missing)
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
        get_db()
        logger.info("MongoDB connected.")
    except Exception as e:
        logger.error(f"MongoDB connection error: {e}")
    yield
    logger.info("Shutting down CivicSync backend.")
    close_db()


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CivicSync AI Backend",
    version="3.0.0",
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

# ── Module 3 Routes (Transparency Engine) ─────────────────────────────────────

app.include_router(bills.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(fake_news.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

# Legacy bare mounts
app.include_router(bills.router)
app.include_router(compare.router)
app.include_router(fake_news.router)
app.include_router(chat.router)

if _has_translation:
    app.include_router(translation.router, prefix="/api")
    app.include_router(translation.router)

# ── Module 2 Routes (Disaster Relief) ────────────────────────────────────────

app.include_router(reports.router)


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
        "version": "3.0.0",
        "database": "MongoDB",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "server": "running"}
