from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

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