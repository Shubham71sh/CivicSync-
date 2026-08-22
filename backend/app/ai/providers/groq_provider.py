"""
GroqProvider — Cloud LLM fallback via Groq REST API.

Refactored from app/services/gemini_client.py (which was actually calling Groq).
Reads GROQ_API_KEY and GROQ_MODEL from settings.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from app.config.settings import settings

logger = logging.getLogger("uvicorn.error")

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _clean_json_string(raw: str) -> str:
    """Strip markdown code fences, sanitize control characters, and extract JSON.
    Used as a fallback when native JSON mode parsing fails.
    """
    raw = raw.strip()

    # Step 1: Strip ```json ... ``` or ``` ... ``` fences
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        raw = match.group(1).strip()
    else:
        # Fallback: extract the outermost { } or [ ] block
        for start_char, end_char in [('{', '}'), ('[', ']')]:
            s = raw.find(start_char)
            e = raw.rfind(end_char)
            if s != -1 and e != -1 and e > s:
                raw = raw[s:e + 1]
                break

    # Step 2: Remove invalid control characters (ASCII 0x00-0x1F)
    # EXCEPT valid JSON whitespace: 0x09 (tab), 0x0A (newline), 0x0D (CR)
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', raw)

    return raw


def _strip_thinking(text: str) -> str:
    """Strip <think>...</think> reasoning blocks from thinking models like qwen3.
    These blocks contain internal chain-of-thought that should not be shown to users.
    """
    # Remove <think>...</think> blocks (including multiline)
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE)
    return text.strip()


class GroqProvider:
    """
    Calls the Groq OpenAI-compatible REST API.

    Public interface:
        generate(prompt)       → str
        chat(messages)         → str
        generate_json(prompt)  → dict | None
        is_available()         → bool
    """

    def _call(self, messages: List[Dict[str, str]], max_tokens: int = 4096,
              json_mode: bool = False) -> str:
        """Internal — sends messages to Groq and returns content string."""
        api_key = settings.GROQ_API_KEY
        if not api_key:
            logger.warning("[Groq] GROQ_API_KEY not set — provider unavailable.")
            return ""

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": max_tokens,
        }
        # Use Groq's native JSON mode to guarantee valid JSON output
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            for attempt in range(3):  # Retry up to 3x for network errors (WinError 10053)
                try:
                    with httpx.Client(timeout=90) as client:
                        resp = client.post(_GROQ_URL, json=payload, headers=headers)
                        resp.raise_for_status()
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        return _strip_thinking(content)  # Remove <think>...</think> blocks (qwen3 etc.)
                except (httpx.ReadError, httpx.ConnectError) as net_exc:
                    import time
                    wait = 2 ** attempt  # 1s, 2s, 4s
                    logger.warning(f"[Groq] Network error on attempt {attempt + 1}: {net_exc}. Retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                except httpx.ConnectError:
                    logger.warning("[Groq] Connection error — check internet access.")
                    return ""
                except httpx.TimeoutException:
                    logger.warning("[Groq] Request timed out.")
                    return ""
                except httpx.HTTPStatusError as exc:
                    logger.warning(f"[Groq] HTTP {exc.response.status_code}: {exc.response.text[:200]}")
                    return ""
                except (KeyError, IndexError) as exc:
                    logger.warning(f"[Groq] Unexpected response structure: {exc}")
                    return ""
            logger.warning("[Groq] All retry attempts failed due to network errors.")
            return ""
        except Exception as exc:
            logger.error(f"[Groq] Unexpected error: {exc}", exc_info=True)
            return ""

    def generate(self, prompt: str, system: Optional[str] = None) -> str:
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return self._call(messages)

    def chat(self, messages: List[Dict[str, str]]) -> str:
        return self._call(messages)

    def generate_json(self, prompt: str, system: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Generate a JSON response using Groq's native JSON mode.
        This guarantees the output is valid JSON without any markdown fences or truncation.
        Falls back to manual extraction if native mode fails.
        """
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        # Groq's JSON mode requires the word "json" somewhere in the messages
        json_hint = prompt if "json" in prompt.lower() else prompt + "\n\nRespond with valid JSON only."
        messages.append({"role": "user", "content": json_hint})

        # Strategy 1: Native JSON mode (8192 tokens to avoid truncation on large documents)
        raw = self._call(messages, max_tokens=8192, json_mode=True)
        if raw:
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, ValueError) as exc:
                logger.warning(f"[Groq] Native JSON mode parse failed: {exc}. Trying fallback.")

        # Strategy 2: Plain generation + manual extraction
        raw = self._call(messages, max_tokens=8192, json_mode=False)
        if not raw:
            return None
        try:
            cleaned = _clean_json_string(raw)
            if cleaned:
                return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(f"[Groq] JSON parse failed: {exc}. Raw (first 300): {raw[:300]}")

        return None

    def is_available(self) -> bool:
        return bool(settings.GROQ_API_KEY)

    def get_model_name(self) -> str:
        return settings.GROQ_MODEL
