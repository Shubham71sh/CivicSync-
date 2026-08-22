"""
AI Orchestrator — Central AI routing layer.

Routes generation requests to the configured primary provider,
with automatic failover to the configured fallback provider.

Provider priority:
  1. Primary (default: Ollama/Qwen3)
  2. Fallback (default: Groq)  — used if primary fails or is unavailable
  3. Hardcoded error message   — if both fail

Configuration:
  AI_PROVIDER=ollama           (ollama | groq | gemini)
  AI_FALLBACK_PROVIDER=groq    (groq | gemini | "" for no fallback)
"""

import logging
from typing import Any, Dict, List, Optional, Union

from app.config.settings import settings
from app.ai.providers.ollama_provider import OllamaProvider
from app.ai.providers.groq_provider import GroqProvider
from app.ai.providers.gemini_provider import GeminiProvider

logger = logging.getLogger("uvicorn.error")

# ── Provider singletons ───────────────────────────────────────────────────────
# These are module-level singletons — constructed once, reused every request.
_ollama = OllamaProvider()
_groq   = GroqProvider()
_gemini = GeminiProvider()

_PROVIDER_MAP = {
    "ollama": _ollama,
    "groq":   _groq,
    "gemini": _gemini,
}


def _get_provider(name: str):
    """Return the provider instance for the given name, or None if unknown."""
    return _PROVIDER_MAP.get(name.lower())


# ── AI Orchestrator ───────────────────────────────────────────────────────────

class AIOrchestrator:
    """
    Central AI generation orchestrator.

    All services should use this class instead of calling providers directly.
    This ensures:
    - Single point of provider switching (via env var)
    - Automatic failover to configured fallback
    - Consistent logging across all AI calls
    - Never crashes the application due to AI unavailability
    """

    def __init__(self):
        self._primary_name  = settings.AI_PROVIDER
        self._fallback_name = settings.AI_FALLBACK_PROVIDER
        self._primary   = _get_provider(self._primary_name)
        self._fallback  = _get_provider(self._fallback_name) if self._fallback_name else None

    # ── Core methods ──────────────────────────────────────────────────────────

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> str:
        """
        Generate text from the AI.

        Args:
            prompt:   The user/main prompt.
            system:   Optional system instruction.
            provider: Override to use a specific provider ("ollama"|"groq"|"gemini").

        Returns:
            Generated text string. Returns a non-empty error hint if all providers fail.
        """
        # Use explicit override if requested
        if provider:
            p = _get_provider(provider)
            if p:
                result = p.generate(prompt, system=system)
                if result:
                    return result
                logger.warning(f"[Orchestrator] Explicit provider '{provider}' returned empty.")

        # Try primary
        result = self._try_generate(self._primary, self._primary_name, prompt, system)
        if result:
            return result

        # Try fallback
        if self._fallback and self._fallback is not self._primary:
            result = self._try_generate(self._fallback, self._fallback_name, prompt, system)
            if result:
                logger.info(f"[Orchestrator] Serving via fallback provider '{self._fallback_name}'.")
                return result

        logger.error("[Orchestrator] All AI providers failed. Returning error message.")
        return "I could not generate a response at this time. Please try again later."

    def chat(
        self,
        messages: List[Dict[str, str]],
        provider: Optional[str] = None,
    ) -> str:
        """
        Multi-turn chat generation.

        Args:
            messages: List of {"role": "user"|"assistant"|"system", "content": "..."}
            provider: Override provider name.

        Returns:
            Assistant reply text.
        """
        if provider:
            p = _get_provider(provider)
            if p:
                result = p.chat(messages)
                if result:
                    return result

        # Primary
        result = self._try_chat(self._primary, self._primary_name, messages)
        if result:
            return result

        # Fallback
        if self._fallback and self._fallback is not self._primary:
            result = self._try_chat(self._fallback, self._fallback_name, messages)
            if result:
                return result

        return "I could not generate a response at this time. Please try again later."

    def generate_json(
        self,
        prompt: str,
        system: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Generate and parse a JSON response.

        Returns:
            Parsed dict, or None if all providers fail or JSON is malformed.
        """
        if provider:
            p = _get_provider(provider)
            if p:
                result = p.generate_json(prompt, system=system)
                if result is not None:
                    return result

        # Primary
        result = self._try_json(self._primary, self._primary_name, prompt, system)
        if result is not None:
            return result

        # Fallback
        if self._fallback and self._fallback is not self._primary:
            result = self._try_json(self._fallback, self._fallback_name, prompt, system)
            if result is not None:
                logger.info(f"[Orchestrator] JSON served via fallback '{self._fallback_name}'.")
                return result

        logger.error("[Orchestrator] All providers failed to produce valid JSON.")
        return None

    # ── Status ────────────────────────────────────────────────────────────────

    def status(self) -> Dict[str, Any]:
        """Return a dict summarising which providers are available."""
        return {
            "primary":  {
                "name": self._primary_name,
                "available": self._primary.is_available() if self._primary else False,
                "model": self._primary.get_model_name() if self._primary else "unknown",
            },
            "fallback": {
                "name": self._fallback_name or "none",
                "available": self._fallback.is_available() if self._fallback else False,
                "model": self._fallback.get_model_name() if self._fallback else "none",
            },
        }

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _try_generate(self, provider, name: str, prompt: str, system) -> str:
        if provider is None:
            return ""
        try:
            result = provider.generate(prompt, system=system)
            if result:
                logger.debug(f"[Orchestrator] generate() via '{name}' success.")
            else:
                logger.warning(f"[Orchestrator] '{name}' returned empty string.")
            return result or ""
        except Exception as exc:
            logger.error(f"[Orchestrator] '{name}' generate() raised: {exc}", exc_info=True)
            return ""

    def _try_chat(self, provider, name: str, messages) -> str:
        if provider is None:
            return ""
        try:
            result = provider.chat(messages)
            return result or ""
        except Exception as exc:
            logger.error(f"[Orchestrator] '{name}' chat() raised: {exc}", exc_info=True)
            return ""

    def _try_json(self, provider, name: str, prompt: str, system) -> Optional[Dict]:
        if provider is None:
            return None
        try:
            return provider.generate_json(prompt, system=system)
        except Exception as exc:
            logger.error(f"[Orchestrator] '{name}' generate_json() raised: {exc}", exc_info=True)
            return None


# ── Module-level singleton ────────────────────────────────────────────────────
# All services import this single instance.
orchestrator = AIOrchestrator()
