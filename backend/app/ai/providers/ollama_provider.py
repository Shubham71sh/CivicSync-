"""
OllamaProvider — Primary LLM provider using local Ollama (Qwen3).

Handles:
- connection failures (Ollama not running)
- model unavailable
- timeout
- invalid / malformed JSON responses
- never propagates raw exceptions to the caller

All methods return a string (or dict for generate_json).
On any failure, a safe fallback string is returned.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from app.config.settings import settings

logger = logging.getLogger("uvicorn.error")

# ── Internal helpers ──────────────────────────────────────────────────────────

_OLLAMA_GENERATE_URL = "{base}/api/generate"
_OLLAMA_CHAT_URL     = "{base}/api/chat"
_OLLAMA_TAGS_URL     = "{base}/api/tags"


def _base() -> str:
    return settings.OLLAMA_BASE_URL.rstrip("/")


def _model() -> str:
    return settings.OLLAMA_MODEL


def _timeout() -> int:
    return settings.OLLAMA_TIMEOUT


def _strip_think_tags(text: str) -> str:
    """Remove <think>…</think> blocks that Qwen3 sometimes emits."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def _clean_json_string(raw: str) -> str:
    """Strip markdown code fences and extract JSON object/array."""
    raw = raw.strip()
    # Remove ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        return match.group(1).strip()
    # Find first { or [ and last } or ]
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        s = raw.find(start_char)
        e = raw.rfind(end_char)
        if s != -1 and e != -1 and e > s:
            return raw[s:e + 1]
    return raw


# ── OllamaProvider ────────────────────────────────────────────────────────────

class OllamaProvider:
    """
    Talks to a locally running Ollama instance.

    Public interface:
        generate(prompt)          → str
        chat(messages)            → str
        generate_json(prompt)     → dict
        is_available()            → bool
    """

    def generate(self, prompt: str, system: Optional[str] = None) -> str:
        """
        Single-turn text generation.

        Args:
            prompt: The full prompt string.
            system: Optional system message.

        Returns:
            Generated text, or a safe error string on failure.
        """
        url = _OLLAMA_GENERATE_URL.format(base=_base())
        payload: Dict[str, Any] = {
            "model": _model(),
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.3, "num_predict": 4096},
        }
        if system:
            payload["system"] = system

        try:
            with httpx.Client(timeout=_timeout()) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                text = data.get("response", "")
                return _strip_think_tags(text) if text else ""
        except httpx.ConnectError:
            logger.warning("[Ollama] Connection refused — is Ollama running?")
            return ""
        except httpx.TimeoutException:
            logger.warning(f"[Ollama] Request timed out after {_timeout()}s.")
            return ""
        except httpx.HTTPStatusError as exc:
            logger.warning(f"[Ollama] HTTP {exc.response.status_code}: {exc.response.text[:200]}")
            return ""
        except Exception as exc:
            logger.error(f"[Ollama] Unexpected error in generate(): {exc}", exc_info=True)
            return ""

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """
        Multi-turn chat generation.

        Args:
            messages: List of {"role": "user"|"assistant"|"system", "content": "..."}

        Returns:
            Assistant reply text, or empty string on failure.
        """
        url = _OLLAMA_CHAT_URL.format(base=_base())
        payload: Dict[str, Any] = {
            "model": _model(),
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.3, "num_predict": 4096},
        }
        try:
            with httpx.Client(timeout=_timeout()) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                text = data.get("message", {}).get("content", "")
                return _strip_think_tags(text) if text else ""
        except httpx.ConnectError:
            logger.warning("[Ollama] Connection refused — is Ollama running?")
            return ""
        except httpx.TimeoutException:
            logger.warning(f"[Ollama] Chat timed out after {_timeout()}s.")
            return ""
        except httpx.HTTPStatusError as exc:
            logger.warning(f"[Ollama] HTTP {exc.response.status_code}: {exc.response.text[:200]}")
            return ""
        except Exception as exc:
            logger.error(f"[Ollama] Unexpected error in chat(): {exc}", exc_info=True)
            return ""

    def generate_json(self, prompt: str, system: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Generate and parse a JSON response.

        Returns:
            Parsed dict, or None if parsing fails.
        """
        raw = self.generate(prompt, system=system)
        if not raw:
            return None
        try:
            cleaned = _clean_json_string(raw)
            return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(f"[Ollama] JSON parse failed: {exc}. Raw (first 300): {raw[:300]}")
            return None

    def is_available(self) -> bool:
        """Quick health check — returns True if Ollama is reachable."""
        try:
            url = _OLLAMA_TAGS_URL.format(base=_base())
            with httpx.Client(timeout=5) as client:
                resp = client.get(url)
                return resp.status_code == 200
        except Exception:
            return False

    def get_model_name(self) -> str:
        return _model()
