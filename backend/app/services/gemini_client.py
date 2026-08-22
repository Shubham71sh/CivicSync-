"""
AI client using Groq REST API.
Model: llama-3.3-70b-versatile (fast, free tier)
"""
import os
import httpx
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load backend/.env regardless of working directory
# gemini_client.py is at: backend/app/services/gemini_client.py
# parents[0] = backend/app/services
# parents[1] = backend/app
# parents[2] = backend   <-- .env lives here
_this_file = Path(__file__).resolve()
_env_path = _this_file.parents[2] / ".env"
load_dotenv(dotenv_path=_env_path, override=False)
print(f"[gemini_client] Loading .env from: {_env_path} (exists={_env_path.exists()})")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"


def call_gemini(prompt: str) -> str:
    """
    Calls Groq API with the given prompt.
    Returns the response text, or raises RuntimeError on failure.
    (Function kept as call_gemini so no other files need changing.)
    """
    if not GROQ_API_KEY:
        raise ValueError(f"GROQ_API_KEY is not set. Tried loading from: {_env_path}")

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
        "max_tokens": 1024,
    }

    with httpx.Client(timeout=60) as client:
        response = client.post(GROQ_URL, json=payload, headers=headers)

    if response.status_code != 200:
        raise RuntimeError(
            f"Groq API error {response.status_code}: {response.text}"
        )

    data = response.json()
    print(f"GROQ RESPONSE: finish_reason={data.get('choices', [{}])[0].get('finish_reason')} usage={data.get('usage')}")

    try:
        content = data["choices"][0]["message"]["content"]
        if not content or not content.strip():
            raise RuntimeError(f"Groq returned empty content. finish_reason={data['choices'][0].get('finish_reason')} usage={data.get('usage')}")
        return content
    except (KeyError, IndexError) as exc:
        raise RuntimeError(
            f"Unexpected Groq response structure: {data}"
        ) from exc
