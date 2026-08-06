"""
AI client using Groq REST API.
Model: llama-3.3-70b-versatile (fast, free tier)
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"


def call_gemini(prompt: str) -> str:
    """
    Calls Groq API with the given prompt.
    Returns the response text, or raises RuntimeError on failure.
    (Function kept as call_gemini so no other files need changing.)
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set in .env")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2048,
    }

    with httpx.Client(timeout=60) as client:
        response = client.post(GROQ_URL, json=payload, headers=headers)

    if response.status_code != 200:
        raise RuntimeError(
            f"Groq API error {response.status_code}: {response.text}"
        )

    data = response.json()

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(
            f"Unexpected Groq response structure: {data}"
        ) from exc
