"""
Language configuration for Multilingual Bill Intelligence.
Allowed languages: English, Hindi, Bengali, Tamil, Telugu, Punjabi.
"""

SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "pa": "Punjabi",
}

# Reverse lookup dictionary (lowercase name -> code)
LANGUAGE_NAMES_TO_CODES = {name.lower(): code for code, name in SUPPORTED_LANGUAGES.items()}


def normalize_language(lang_input: str) -> tuple[str, str]:
    """
    Given a language code (e.g., 'hi') or language name (e.g., 'Hindi'),
    returns a tuple of (lang_code, lang_display_name).
    Defaults to ('en', 'English') if unsupported.
    """
    if not lang_input:
        return "en", "English"

    clean_input = str(lang_input).strip().lower()

    if clean_input in SUPPORTED_LANGUAGES:
        return clean_input, SUPPORTED_LANGUAGES[clean_input]

    if clean_input in LANGUAGE_NAMES_TO_CODES:
        code = LANGUAGE_NAMES_TO_CODES[clean_input]
        return code, SUPPORTED_LANGUAGES[code]

    return "en", "English"
