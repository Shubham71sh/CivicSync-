


# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from contextlib import asynccontextmanager
import logging

from app.config.settings import settings
from app.config.database import get_db, close_db
from app.config.gemini import get_gemini_client

# Import transparency engine routers
from app.api.routes import bills, compare, fake_news

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

# Register without prefix for fallback compatibility with some frontend layouts
app.include_router(bills.router)
app.include_router(compare.router)
app.include_router(fake_news.router)


# -----------------------------
# AI Chat and Profile Endpoints
# (Preserved from existing backend to retain system integrations)
# -----------------------------


class ChatRequest(BaseModel):
    message: str
    language: str = "en"



# -----------------------------
# Profile Model
# -----------------------------

class Profile(BaseModel):
    name: str
    email: str
    phone: str
    location: str
    dob: str
    profession: str
    income: str



# -----------------------------
# Temporary Profile Data
# -----------------------------

# Temporary In-Memory Profile Data (Synchronized with frontend profile service)

profile_data = {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1 (555) 019-2834",
    "location": "Delhi",
    "dob": "1996-05-14",
    "profession": "Tech Professional",
    "income": "$50,000 - $100,000"
}



# -----------------------------
# AI Chat Endpoint
# -----------------------------
@app.post("/chat")
async def chat(data: ChatRequest):

@app.post("/chat")
async def chat(data: ChatRequest):
    client = get_gemini_client()

    if not client:
        return {
            "response": "Error: GEMINI_API_KEY is not set or invalid. Please check your backend configuration."
        }

    language_map = {
        "en": "English",
        "hi": "Hindi",
        "pa": "Punjabi"
    }

    # Extract language prefix (e.g. "en-US" -> "en")
    lang_code = data.language.split("-")[0] if "-" in data.language else data.language

    profile_context = f"""
User Profile Context:
- Name: {profile_data.get('name', 'N/A')}
- Email: {profile_data.get('email', 'N/A')}
- Phone: {profile_data.get('phone', 'N/A')}
- Location: {profile_data.get('location', 'N/A')}
- Date of Birth: {profile_data.get('dob', 'N/A')}
- Profession/Industry: {profile_data.get('profession', 'N/A')}
- Annual Income: {profile_data.get('income', 'N/A')}
"""

    prompt = f"""
You are CivicSync AI, a highly intelligent, empathetic, and professional civic assistant.
Use the user's profile context below to personalize, tailor, and make the response highly relevant.
For example, if they ask about laws, taxes, or benefits, reference their location, profession, or income if applicable.

{profile_context}

Respond ONLY in the language: {language_map.get(lang_code, 'English')}.
Keep formatting clean, simple, and easy to read.

User Question:
{data.message}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return {
            "response": response.text
        }
    except Exception as e:

        print(f"Error calling Gemini API: {e}")

        logger.error(f"Error calling Gemini API: {e}")

        return {
            "response": f"Error communicating with Gemini: {str(e)}"
        }



# -----------------------------
# Get Profile
# -----------------------------

@app.get("/profile")
async def get_profile():
    return profile_data



# -----------------------------
# Update Profile
# -----------------------------
@app.put("/profile")
async def update_profile(profile: Profile):
    global profile_data

    profile_data = profile.model_dump()

    print("Updated Profile:", profile_data)

    return {
        "message": "Profile updated successfully",
        "profile": profile_data
    }

@app.put("/profile")
async def update_profile(profile: Profile):
    global profile_data
    profile_data = profile.model_dump()
    logger.info(f"Updated Profile: {profile_data}")
    return {
        "message": "Profile updated successfully",
        "profile": profile_data
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