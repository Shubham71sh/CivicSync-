from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import os

# -----------------------------
# Load Environment Variables
# -----------------------------
load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()

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

    language_map = {
        "en": "English",
        "hi": "Hindi",
        "pa": "Punjabi"
    }

    prompt = f"""
Respond only in {language_map.get(data.language, 'English')}.

User Question:
{data.message}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return {
        "response": response.text
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