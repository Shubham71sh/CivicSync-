


# pyrefly: ignore [missing-import]
from fastapi import Depends, FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Any, Dict
from contextlib import asynccontextmanager
import logging

from app.config.settings import settings
from app.config.database import get_db, close_db
from app.config.gemini import get_gemini_client
from app.middleware.auth import get_current_user
from app.services.profile_service import ProfileService

# Import transparency engine routers
from app.api.routes import bills, compare, fake_news, chat

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

# -----------------------------
# Lifespan Handler (DB Setup)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Establish MongoDB connection on startup
    logger.info("Initializing database connection...")
    try:
        get_db()
    except Exception as e:
        logger.error(f"Could not connect to database on startup: {e}")
    
    yield
    
    # Close MongoDB connection on shutdown
    logger.info("Closing database connection...")
    close_db()


# -----------------------------
# FastAPI App
# -----------------------------

app = FastAPI()


app = FastAPI(
    title="CivicSync AI Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Allow React Frontend and credentials

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Chat Model
# -----------------------------


# -----------------------------
# Register Routers
# -----------------------------
# Register with /api prefix as requested
app.include_router(bills.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(fake_news.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

# Register without prefix for fallback compatibility with some frontend layouts
app.include_router(bills.router)
app.include_router(compare.router)
app.include_router(fake_news.router)
app.include_router(chat.router)


# -----------------------------
# AI Chat and Profile Endpoints
# (Preserved from existing backend to retain system integrations)
# -----------------------------

# -----------------------------
# Profile Model
# -----------------------------

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


# -----------------------------
# Get Profile
# -----------------------------

@app.get("/profile")
@app.get("/api/profile")
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return await ProfileService(get_db()).get_profile(
        current_user["_id"],
        user_defaults=current_user,
    )



# -----------------------------
# Update Profile
# -----------------------------
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

@app.get("/")
def root():
    return {
        "message": "🚀 CivicSync Backend Running Successfully",
        "module": "Module 3 (Transparency Engine) Active"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "server": "running"

    }
