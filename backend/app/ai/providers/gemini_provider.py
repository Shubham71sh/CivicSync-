"""
GeminiProvider — Legacy optional provider wrapping google-genai SDK.

Only used when AI_PROVIDER=gemini or as fallback.
Gracefully returns empty string/None if GEMINI_API_KEY is not set.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

from app.config.gemini import get_gemini_client

logger = logging.getLogger("uvicorn.error")


def _clean_json_string(raw: str) -> str:
    raw = raw.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        return match.group(1).strip()
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        s = raw.find(start_char)
        e = raw.rfind(end_char)
        if s != -1 and e != -1 and e > s:
            return raw[s:e + 1]
    return raw


class GeminiProvider:
    """
    Wraps the google-genai Gemini SDK as a provider.

    Public interface:
        generate(prompt)       → str
        chat(messages)         → str (converts to single prompt)
        generate_json(prompt)  → dict | None
        is_available()         → bool
    """

    _GEMINI_MODEL = "gemini-2.0-flash"

    def _get_client(self):
        return get_gemini_client()

    def generate(self, prompt: str, system: Optional[str] = None) -> str:
        client = self._get_client()
        if client is None:
            logger.warning("[Gemini] Client not available — GEMINI_API_KEY missing?")
            return ""
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        try:
            response = client.models.generate_content(
                model=self._GEMINI_MODEL,
                contents=full_prompt,
            )
            text = getattr(response, "text", None) or ""
            return text.strip()
        except Exception as exc:
            logger.error(f"[Gemini] generate() failed: {exc}", exc_info=True)
            return ""

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """Convert message list to a single prompt for Gemini (no native chat API used here)."""
        parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                parts.insert(0, f"System: {content}")
            elif role == "assistant":
                parts.append(f"Assistant: {content}")
            else:
                parts.append(f"User: {content}")
        return self.generate("\n\n".join(parts))

    def generate_json(self, prompt: str, system: Optional[str] = None) -> Optional[Dict[str, Any]]:
        raw = self.generate(prompt, system=system)
        if not raw:
            return None
        try:
            cleaned = _clean_json_string(raw)
            return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(f"[Gemini] JSON parse failed: {exc}. Raw (first 300): {raw[:300]}")
            return None

    def is_available(self) -> bool:
        return self._get_client() is not None

    def get_model_name(self) -> str:
        return self._GEMINI_MODEL
