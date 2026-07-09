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

api_key = os.getenv("GEMINI_API_KEY")
client = None

if api_key:
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
else:
    print("WARNING: GEMINI_API_KEY is not set. Please add it to your .env file.")

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