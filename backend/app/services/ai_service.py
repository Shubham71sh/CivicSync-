"""
AI Service — Gemini Vision-powered disaster evidence validation and damage assessment.

Two public functions:
  validate_evidence(file_bytes, filename, disaster_type)
      → Validates a single uploaded file against the selected disaster type.
      → Returns structured evidence result: valid/relevant/confidence/detected_objects/etc.

  analyze_disaster(disaster_type, evidence_context)
      → Full damage assessment using the validated evidence context from Step 2.
      → Returns damage_percent, severity, category breakdown, estimated_loss, ai_confidence.
      → Falls back to clearly-labelled estimates ONLY when Gemini is unavailable.
"""

import os
import io
import re
import json
import base64
import logging
import mimetypes
from typing import Optional

from dotenv import load_dotenv
from google import genai

load_dotenv()

logger = logging.getLogger("uvicorn.error")

_client: Optional[genai.Client] = None


def _get_client() -> Optional[genai.Client]:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if api_key:
            try:
                _client = genai.Client(api_key=api_key)
                logger.info("[AI] Gemini client initialised.")
            except Exception as exc:
                logger.error(f"[AI] Gemini client init failed: {exc}")
    return _client


# ---------------------------------------------------------------------------
# Disaster-type fallback values  (used ONLY when Gemini is completely
# unavailable — clearly labelled is_fallback=True so UI can warn the user)
# ---------------------------------------------------------------------------
_DISASTER_FALLBACKS = {
    "flood": {
        "damage_percent": 65, "severity": "Major",
        "house_damage": 70, "crop_damage": 60, "vehicle_damage": 25,
        "estimated_loss": 380000, "ai_confidence": 0, "is_fallback": True,
        "evidence_summary": "AI unavailable. Values are disaster-type estimates.",
        "observations": [],
        "limitations": ["Gemini Vision service unavailable — fallback values shown."],
        "metrics": [
            {"label": "House Damage",   "value": 70, "unit": "%"},
            {"label": "Crop Damage",    "value": 60, "unit": "%"},
            {"label": "Water Damage",   "value": 80, "unit": "%"},
            {"label": "Vehicle Damage", "value": 25, "unit": "%"},
        ],
    },
    "earthquake": {
        "damage_percent": 72, "severity": "High",
        "house_damage": 80, "crop_damage": 20, "vehicle_damage": 30,
        "estimated_loss": 510000, "ai_confidence": 0, "is_fallback": True,
        "evidence_summary": "AI unavailable. Values are disaster-type estimates.",
        "observations": [],
        "limitations": ["Gemini Vision service unavailable — fallback values shown."],
        "metrics": [
            {"label": "Structural Damage",    "value": 80, "unit": "%"},
            {"label": "Building Collapse Risk","value": 65, "unit": "%"},
            {"label": "Property Damage",      "value": 70, "unit": "%"},
            {"label": "Vehicle Damage",       "value": 30, "unit": "%"},
        ],
    },
    "fire": {
        "damage_percent": 68, "severity": "High",
        "house_damage": 75, "crop_damage": 0, "vehicle_damage": 20,
        "estimated_loss": 420000, "ai_confidence": 0, "is_fallback": True,
        "evidence_summary": "AI unavailable. Values are disaster-type estimates.",
        "observations": [],
        "limitations": ["Gemini Vision service unavailable — fallback values shown."],
        "metrics": [
            {"label": "Structural Damage", "value": 75, "unit": "%"},
            {"label": "Interior Damage",   "value": 70, "unit": "%"},
            {"label": "Burn Area",         "value": 60, "unit": "%"},
            {"label": "Vehicle Damage",    "value": 20, "unit": "%"},
        ],
    },
    "cyclone": {
        "damage_percent": 70, "severity": "High",
        "house_damage": 72, "crop_damage": 55, "vehicle_damage": 30,
        "estimated_loss": 460000, "ai_confidence": 0, "is_fallback": True,
        "evidence_summary": "AI unavailable. Values are disaster-type estimates.",
        "observations": [],
        "limitations": ["Gemini Vision service unavailable — fallback values shown."],
        "metrics": [
            {"label": "Structural Damage", "value": 72, "unit": "%"},
            {"label": "Roof Damage",       "value": 65, "unit": "%"},
            {"label": "Crop Damage",       "value": 55, "unit": "%"},
            {"label": "Vehicle Damage",    "value": 30, "unit": "%"},
        ],
    },
    "landslide": {
        "damage_percent": 60, "severity": "Major",
        "house_damage": 65, "crop_damage": 40, "vehicle_damage": 20,
        "estimated_loss": 320000, "ai_confidence": 0, "is_fallback": True,
        "evidence_summary": "AI unavailable. Values are disaster-type estimates.",
        "observations": [],
        "limitations": ["Gemini Vision service unavailable — fallback values shown."],
        "metrics": [
            {"label": "Structural Damage", "value": 65, "unit": "%"},
            {"label": "Land Damage",       "value": 70, "unit": "%"},
            {"label": "House Damage",      "value": 55, "unit": "%"},
            {"label": "Vehicle Damage",    "value": 20, "unit": "%"},
        ],
    },
    "rain": {
        "damage_percent": 50, "severity": "Moderate",
        "house_damage": 45, "crop_damage": 50, "vehicle_damage": 15,
        "estimated_loss": 220000, "ai_confidence": 0, "is_fallback": True,
        "evidence_summary": "AI unavailable. Values are disaster-type estimates.",
        "observations": [],
        "limitations": ["Gemini Vision service unavailable — fallback values shown."],
        "metrics": [
            {"label": "Water Damage",    "value": 55, "unit": "%"},
            {"label": "Property Damage", "value": 45, "unit": "%"},
            {"label": "Crop Damage",     "value": 50, "unit": "%"},
            {"label": "Vehicle Damage",  "value": 15, "unit": "%"},
        ],
    },
}

_DISASTER_ALIAS = {
    "heavy rain": "rain", "heavy_rain": "rain",
    "floods": "flood", "earthquakes": "earthquake",
    "fires": "fire", "cyclones": "cyclone", "landslides": "landslide",
}

# Image MIME types we can send directly to Gemini Vision
_SUPPORTED_IMAGE_MIMES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "image/gif", "image/heic", "image/heif",
}


def _normalise_disaster(disaster_type: str) -> str:
    key = (disaster_type or "flood").lower().strip()
    return _DISASTER_ALIAS.get(key, key)


def _get_fallback(disaster_type: str) -> dict:
    return _DISASTER_FALLBACKS.get(
        _normalise_disaster(disaster_type),
        _DISASTER_FALLBACKS["flood"]
    ).copy()


def _parse_json(raw: str) -> dict:
    """Strip markdown fences and parse JSON."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


def _detect_mime(file_bytes: bytes, filename: str) -> str:
    """Detect MIME type from magic bytes first, fall back to extension."""
    # Magic byte detection for common types
    sigs = [
        (b"\xff\xd8\xff", "image/jpeg"),
        (b"\x89PNG\r\n", "image/png"),
        (b"RIFF", None),   # need to check further for webp
        (b"GIF87a", "image/gif"),
        (b"GIF89a", "image/gif"),
        (b"%PDF",   "application/pdf"),
        (b"\x1aE\xdf\xa3", "video/webm"),
        (b"\x00\x00\x00\x18ftypmp4", "video/mp4"),
        (b"\x00\x00\x00\x20ftypiso", "video/mp4"),
        (b"ftyp", "video/mp4"),
    ]
    header = file_bytes[:32]
    for sig, mime in sigs:
        if header.startswith(sig):
            if sig == b"RIFF" and len(header) >= 12 and header[8:12] == b"WEBP":
                return "image/webp"
            if mime:
                return mime
    # Fall back to extension
    guessed, _ = mimetypes.guess_type(filename or "file.bin")
    return guessed or "application/octet-stream"


# ---------------------------------------------------------------------------
# Public API 1 — Evidence Validation (Step 2)
# ---------------------------------------------------------------------------

def validate_evidence(
    file_bytes: bytes,
    filename: str,
    disaster_type: str,
) -> dict:
    """
    Validate a single uploaded file against the selected disaster type.

    Returns a dict:
      {
        "valid": bool,          # file is readable and a supported type
        "relevant": bool,       # content matches selected disaster
        "confidence": int,      # 0-100 relevance confidence
        "file_type": str,       # "image" | "pdf" | "video" | "document"
        "detected_objects": [], # list of detected objects/content
        "evidence": [],         # specific evidence found
        "possible_damage": [],  # damage categories detected
        "reject_reason": str,   # human-readable rejection reason (if any)
        "summary": str,         # one-line evidence summary
        "disaster": str,        # echoed back
      }
    """
    if not file_bytes or len(file_bytes) < 16:
        return _reject("File appears to be empty or corrupted.", disaster_type)

    mime = _detect_mime(file_bytes, filename)
    file_type = _classify_file_type(mime)

    if file_type == "unsupported":
        return _reject(
            f"Unsupported file type '{mime}'. Please upload a JPEG, PNG, WEBP, PDF, or MP4.",
            disaster_type,
        )

    client = _get_client()
    if client is None:
        logger.warning("[AI] Gemini unavailable — evidence validation skipped, treating as valid.")
        # When Gemini is unavailable we cannot validate — be honest
        return {
            "valid": True,
            "relevant": True,
            "confidence": 0,
            "file_type": file_type,
            "detected_objects": [],
            "evidence": [],
            "possible_damage": [],
            "reject_reason": "",
            "summary": "AI service unavailable — evidence accepted without validation.",
            "disaster": disaster_type,
            "ai_unavailable": True,
        }

    # ── Image validation via Gemini Vision ──────────────────────────────────
    if file_type == "image" and mime in _SUPPORTED_IMAGE_MIMES:
        return _validate_image_with_gemini(client, file_bytes, mime, filename, disaster_type)

    # ── PDF text extraction + Gemini text analysis ──────────────────────────
    if file_type == "pdf":
        return _validate_pdf_with_gemini(client, file_bytes, filename, disaster_type)

    # ── Video — cannot send to Gemini directly; do basic accept with caveat ─
    if file_type == "video":
        return {
            "valid": True,
            "relevant": True,
            "confidence": 50,
            "file_type": "video",
            "detected_objects": ["video evidence"],
            "evidence": ["Video file submitted — content will be reviewed by field officer"],
            "possible_damage": [],
            "reject_reason": "",
            "summary": "Video evidence accepted for officer review.",
            "disaster": disaster_type,
        }

    return _reject("Unrecognised file format. Please upload a supported file type.", disaster_type)


def _classify_file_type(mime: str) -> str:
    if mime in _SUPPORTED_IMAGE_MIMES:
        return "image"
    if mime == "application/pdf":
        return "pdf"
    if mime.startswith("video/"):
        return "video"
    if mime in ("application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain"):
        return "document"
    return "unsupported"


def _reject(reason: str, disaster_type: str) -> dict:
    return {
        "valid": False,
        "relevant": False,
        "confidence": 0,
        "file_type": "unknown",
        "detected_objects": [],
        "evidence": [],
        "possible_damage": [],
        "reject_reason": reason,
        "summary": reason,
        "disaster": disaster_type,
    }


def _validate_image_with_gemini(client, file_bytes: bytes, mime: str, filename: str, disaster_type: str) -> dict:
    prompt = f"""You are an AI disaster evidence verification system.

The user has selected disaster type: "{disaster_type}"
The uploaded image filename is: "{filename}"

Carefully analyse this image and return ONLY a valid JSON object with these exact keys:

{{
  "content_description": "Brief description of what is visible in the image",
  "is_disaster_relevant": true or false,
  "relevance_confidence": integer 0-100,
  "detected_objects": ["list", "of", "visible", "objects"],
  "disaster_evidence": ["specific", "disaster-related", "evidence", "found"],
  "possible_damage_categories": ["damage", "categories", "visible"],
  "reject_reason": "reason if not relevant, empty string if relevant"
}}

IMPORTANT RULES:
- is_disaster_relevant must be true ONLY if the image shows clear evidence of "{disaster_type}" or its direct effects.
- A photo of an undamaged normal car is NOT relevant for flood, earthquake, fire, etc.
- A damaged or submerged vehicle IS relevant for flood.
- A cracked wall IS relevant for earthquake.
- A burned structure IS relevant for fire.
- relevance_confidence must reflect your actual certainty.
- If confidence is below 40, set is_disaster_relevant to false.
- Return ONLY the JSON object, no markdown, no explanation.
"""
    try:
        from google.genai import types as genai_types
        part = genai_types.Part.from_bytes(data=file_bytes, mime_type=mime)
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=[prompt, part],
        )
        result = _parse_json(response.text)

        is_relevant = bool(result.get("is_disaster_relevant", False))
        confidence = int(result.get("relevance_confidence", 0))

        return {
            "valid": True,
            "relevant": is_relevant,
            "confidence": confidence,
            "file_type": "image",
            "detected_objects": result.get("detected_objects", []),
            "evidence": result.get("disaster_evidence", []),
            "possible_damage": result.get("possible_damage_categories", []),
            "reject_reason": result.get("reject_reason", "") if not is_relevant else "",
            "summary": result.get("content_description", ""),
            "disaster": disaster_type,
        }
    except Exception as exc:
        logger.error(f"[AI] Image validation Gemini error: {exc}")
        # Gemini errored mid-call — be honest, don't silently accept
        return {
            "valid": True,
            "relevant": True,
            "confidence": 0,
            "file_type": "image",
            "detected_objects": [],
            "evidence": [],
            "possible_damage": [],
            "reject_reason": "",
            "summary": "AI validation encountered an error — evidence accepted for manual review.",
            "disaster": disaster_type,
            "ai_unavailable": True,
        }


def _validate_pdf_with_gemini(client, file_bytes: bytes, filename: str, disaster_type: str) -> dict:
    # Extract text from PDF using pypdf
    text_content = ""
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages[:10]:  # cap at 10 pages
            pages.append(page.extract_text() or "")
        text_content = "\n".join(pages).strip()
    except Exception as exc:
        logger.warning(f"[AI] PDF text extraction failed: {exc}")
        return _reject("The PDF file could not be read. It may be corrupted, scanned-only, or password-protected.", disaster_type)

    if not text_content:
        return _reject(
            "The PDF appears to contain no extractable text (may be a scanned image). Please upload a text-based PDF.",
            disaster_type,
        )

    # Truncate to avoid token limits
    text_snippet = text_content[:4000]

    prompt = f"""You are an AI disaster evidence verification system.

The user has selected disaster type: "{disaster_type}"
The uploaded PDF filename is: "{filename}"

Below is the extracted text from the PDF document:
---
{text_snippet}
---

Analyse whether this document contains genuine evidence or information related to "{disaster_type}" damage.

Return ONLY a valid JSON object:
{{
  "content_description": "Brief description of the document content",
  "is_disaster_relevant": true or false,
  "relevance_confidence": integer 0-100,
  "detected_objects": ["key", "entities", "mentioned"],
  "disaster_evidence": ["specific", "evidence", "or", "facts", "found"],
  "possible_damage_categories": ["damage", "categories", "mentioned"],
  "reject_reason": "reason if not relevant, empty string if relevant"
}}

IMPORTANT: Only set is_disaster_relevant true if the document genuinely contains disaster-related information.
Return ONLY the JSON object, no markdown.
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=[prompt],
        )
        result = _parse_json(response.text)
        is_relevant = bool(result.get("is_disaster_relevant", False))
        confidence = int(result.get("relevance_confidence", 0))

        return {
            "valid": True,
            "relevant": is_relevant,
            "confidence": confidence,
            "file_type": "pdf",
            "detected_objects": result.get("detected_objects", []),
            "evidence": result.get("disaster_evidence", []),
            "possible_damage": result.get("possible_damage_categories", []),
            "reject_reason": result.get("reject_reason", "") if not is_relevant else "",
            "summary": result.get("content_description", ""),
            "disaster": disaster_type,
        }
    except Exception as exc:
        logger.error(f"[AI] PDF validation Gemini error: {exc}")
        return {
            "valid": True,
            "relevant": True,
            "confidence": 0,
            "file_type": "pdf",
            "detected_objects": [],
            "evidence": [f"Document submitted: {filename}"],
            "possible_damage": [],
            "reject_reason": "",
            "summary": "PDF document accepted for manual review.",
            "disaster": disaster_type,
            "ai_unavailable": True,
        }


# ---------------------------------------------------------------------------
# Public API 2 — Damage Assessment (Step 3 → Step 4)
# ---------------------------------------------------------------------------

def analyze_disaster(
    disaster_type: str,
    evidence_context: Optional[dict] = None,
    image_paths: Optional[list] = None,  # legacy param, ignored now
) -> dict:
    """
    Perform AI damage assessment using the validated evidence from Step 2.

    evidence_context is the validated evidence dict from validate_evidence():
      {
        "file_type": "image"|"pdf"|"video",
        "detected_objects": [...],
        "evidence": [...],
        "possible_damage": [...],
        "summary": "...",
        "confidence": int,
        "file_bytes_b64": "...",   # base64-encoded file bytes (for images)
        "file_mime": "...",
      }

    Returns:
      damage_percent, severity, house_damage, crop_damage, vehicle_damage,
      estimated_loss, ai_confidence, metrics, evidence_summary, observations,
      limitations, is_fallback
    """
    client = _get_client()

    # Build evidence description from context
    ev = evidence_context or {}
    evidence_items = ev.get("evidence", [])
    detected = ev.get("detected_objects", [])
    damage_cats = ev.get("possible_damage", [])
    ev_summary = ev.get("summary", "")
    file_type = ev.get("file_type", "unknown")
    file_bytes_b64 = ev.get("file_bytes_b64")
    file_mime = ev.get("file_mime", "image/jpeg")

    # Compose evidence text for prompt
    evidence_text = "\n".join([
        f"- Detected objects: {', '.join(detected) if detected else 'Not available'}",
        f"- Evidence found: {', '.join(evidence_items) if evidence_items else 'Not available'}",
        f"- Possible damage categories: {', '.join(damage_cats) if damage_cats else 'Not specified'}",
        f"- Evidence summary: {ev_summary or 'Not available'}",
        f"- Evidence file type: {file_type}",
    ])

    d_key = _normalise_disaster(disaster_type)

    if client is None:
        logger.warning("[AI] Gemini unavailable — using fallback damage values.")
        return _get_fallback(disaster_type)

    prompt = f"""You are an expert AI disaster damage assessment system working for the Indian government.

Selected disaster type: "{disaster_type}"

Validated evidence from uploaded file:
{evidence_text}

Based ONLY on the actual evidence described above, assess the disaster damage.

CRITICAL RULES:
1. Do NOT invent damage for categories that are not visible in the evidence.
2. If a damage category cannot be assessed from the evidence, set its value to -1 (meaning "not detected").
3. Do NOT show crop damage if there is no agricultural evidence.
4. Do NOT show vehicle damage if no vehicle is mentioned in the evidence.
5. Be realistic — only report what the evidence actually supports.
6. estimated_loss must be an integer in INR (Indian Rupees), without currency symbol.

Return ONLY a valid JSON object with these exact keys:
{{
  "damage_percent": integer 0-100,
  "severity": one of "Minor" | "Moderate" | "Major" | "Severe",
  "house_damage": integer 0-100 or -1 if not detected,
  "crop_damage": integer 0-100 or -1 if not detected,
  "vehicle_damage": integer 0-100 or -1 if not detected,
  "estimated_loss": integer in INR,
  "ai_confidence": integer 0-100,
  "evidence_summary": "One or two sentence summary of what the evidence shows",
  "observations": ["key", "observation", "1", "key observation 2"],
  "limitations": ["what could not be assessed from the evidence"],
  "metrics": [
    {{"label": "Category Name", "value": integer, "unit": "%"}}
  ]
}}

For metrics, only include categories where value >= 0 (detected). 
Use disaster-appropriate category names:
- Flood: House Damage, Water Damage, Crop Damage, Vehicle Damage
- Earthquake: Structural Damage, Building Collapse Risk, Property Damage, Vehicle Damage
- Fire: Structural Damage, Interior Damage, Burn Area, Vehicle Damage
- Cyclone: Structural Damage, Roof Damage, Crop Damage, Vehicle Damage
- Landslide: Structural Damage, Land Damage, House Damage, Vehicle Damage
- Heavy Rain: Water Damage, Property Damage, Crop Damage, Vehicle Damage

Return ONLY the JSON. No markdown. No explanation.
"""

    try:
        contents = [prompt]

        # If we have actual image bytes, send them to Gemini Vision
        if file_type == "image" and file_bytes_b64 and file_mime in _SUPPORTED_IMAGE_MIMES:
            try:
                from google.genai import types as genai_types
                img_bytes = base64.b64decode(file_bytes_b64)
                part = genai_types.Part.from_bytes(data=img_bytes, mime_type=file_mime)
                contents.append(part)
                logger.info(f"[AI] Sending image bytes to Gemini for damage analysis ({file_mime})")
            except Exception as exc:
                logger.warning(f"[AI] Could not attach image to analysis prompt: {exc}")

        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=contents,
        )

        result = _parse_json(response.text)

        # Sanitise: replace -1 sentinel with None so frontend can show "Not detected"
        for field in ("house_damage", "crop_damage", "vehicle_damage"):
            val = result.get(field)
            if val is None or val < 0:
                result[field] = None

        # Sanitise metrics — drop undetected ones
        metrics = result.get("metrics", [])
        result["metrics"] = [m for m in metrics if isinstance(m.get("value"), (int, float)) and m["value"] >= 0]

        result["is_fallback"] = False
        logger.info(f"[AI] Damage assessment complete — {result.get('damage_percent')}% ({result.get('severity')}), confidence={result.get('ai_confidence')}%")
        return result

    except Exception as exc:
        logger.error(f"[AI] Gemini analyze_disaster error: {exc}")
        return _get_fallback(disaster_type)
