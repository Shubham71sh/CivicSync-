"""
Profession-Based Government Scheme Notification Service
Uses Gemini AI to match government schemes to a user's profession, state,
and demographic profile. Persists recommendations as in-app notifications.
"""

import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

from app.config.database import get_col
from app.config.gemini import get_gemini_client

logger = logging.getLogger("uvicorn.error")

NOTIFICATIONS_COLLECTION = "scheme_notifications"
PREFERENCES_COLLECTION = "notification_preferences"


# ── Gemini Recommendation Prompt ──────────────────────────────────────────────

_PROFESSION_CATEGORIES = {
    "farmer": ["agriculture", "employment", "housing"],
    "student": ["education", "scholarship", "digital"],
    "doctor": ["healthcare", "business", "employment"],
    "teacher": ["education", "housing", "employment"],
    "entrepreneur": ["business", "digital", "employment"],
    "engineer": ["digital", "business", "housing"],
    "daily wage worker": ["employment", "housing", "healthcare"],
    "self employed": ["business", "employment", "digital"],
    "homemaker": ["women", "housing", "healthcare"],
    "artisan": ["employment", "business", "agriculture"],
    "retired": ["healthcare", "housing", "other"],
    "unemployed": ["employment", "digital", "education"],
}


def _build_recommendation_prompt(profession: str, state: str, income: str, existing_schemes: List[str]) -> str:
    category_hints = _PROFESSION_CATEGORIES.get(profession.lower(), ["employment", "housing", "healthcare"])
    existing_str = ", ".join(existing_schemes) if existing_schemes else "none"
    return f"""
You are an expert Indian government scheme advisor.

A citizen has the following profile:
- Profession: {profession}
- State: {state}
- Monthly Income: {income or "Not specified"}
- Already applied for: {existing_str}

Recommend exactly 6 government schemes most relevant to this citizen.
Prioritise schemes from these categories: {", ".join(category_hints)}.

Return ONLY valid JSON — no markdown, no code fences.

Required structure:
[
  {{
    "schemeName": "",
    "ministry": "",
    "category": "",
    "description": "",
    "eligibility": "",
    "benefit": "",
    "applicationProcess": "",
    "officialLink": "",
    "relevanceScore": 0,
    "relevanceReason": "",
    "priority": "high|medium|low",
    "deadline": ""
  }}
]

Rules:
- relevanceScore: integer 0-100 (how well this scheme fits the citizen's profile).
- priority: "high" if relevanceScore >= 80, "medium" if >= 50, else "low".
- Use real Indian government scheme names (PM schemes, state-level schemes).
- description: 2-3 sentences plain language.
- deadline: use "" if no fixed deadline.
- Exclude schemes already applied for.
- Sort by relevanceScore descending.
"""


def _mock_recommendations(profession: str, state: str) -> List[Dict[str, Any]]:
    return [
        {
            "schemeName": "PM Mudra Yojana",
            "ministry": "Ministry of Finance",
            "category": "business",
            "description": (
                "Provides collateral-free micro-loans up to ₹10 lakh for small and micro enterprises. "
                "Covers manufacturing, trading, and service sector businesses."
            ),
            "eligibility": "Indian citizens running non-farm micro/small enterprises.",
            "benefit": "Loans up to ₹10 lakh at competitive interest rates.",
            "applicationProcess": "Apply at any scheduled commercial bank, MFI, or online via mudra.org.in.",
            "officialLink": "https://www.mudra.org.in",
            "relevanceScore": 88,
            "relevanceReason": f"Highly relevant for {profession} looking to start or expand a business.",
            "priority": "high",
            "deadline": "",
        },
        {
            "schemeName": "Pradhan Mantri Awas Yojana (PMAY)",
            "ministry": "Ministry of Housing and Urban Affairs",
            "category": "housing",
            "description": (
                "Credit-linked subsidy scheme for home loans for EWS, LIG, and MIG categories. "
                "Helps economically weaker sections own their first home."
            ),
            "eligibility": "Annual income up to ₹18 lakh; first-time homebuyer.",
            "benefit": "Interest subsidy of 3%-6.5% on home loans.",
            "applicationProcess": "Apply through a primary lending institution or via pmaymis.gov.in.",
            "officialLink": "https://pmaymis.gov.in",
            "relevanceScore": 80,
            "relevanceReason": "Housing subsidy available to eligible citizens across all professions.",
            "priority": "high",
            "deadline": "31 March 2025",
        },
        {
            "schemeName": "Atal Pension Yojana (APY)",
            "ministry": "Ministry of Finance",
            "category": "employment",
            "description": (
                "Guaranteed pension scheme for workers in the unorganised sector. "
                "Subscribers receive ₹1,000 to ₹5,000 per month after age 60."
            ),
            "eligibility": "Indian citizens aged 18-40 with a bank account.",
            "benefit": "Monthly pension of ₹1,000–₹5,000 post retirement.",
            "applicationProcess": "Enrol through your bank branch or net banking portal.",
            "officialLink": "https://npscra.nsdl.co.in/scheme-details.php",
            "relevanceScore": 75,
            "relevanceReason": "Pension security is beneficial regardless of profession.",
            "priority": "medium",
            "deadline": "",
        },
        {
            "schemeName": "PM Jan Arogya Yojana (Ayushman Bharat)",
            "ministry": "Ministry of Health and Family Welfare",
            "category": "healthcare",
            "description": (
                "Provides health insurance cover of ₹5 lakh per family per year "
                "for secondary and tertiary hospitalisation. Covers 1,574+ procedures."
            ),
            "eligibility": "Families listed in SECC 2011 database or as per state criteria.",
            "benefit": "Cashless hospitalisation up to ₹5 lakh per year.",
            "applicationProcess": "Check eligibility at pmjay.gov.in; get Ayushman card at CSC centres.",
            "officialLink": "https://pmjay.gov.in",
            "relevanceScore": 72,
            "relevanceReason": "Critical healthcare coverage for all eligible citizens.",
            "priority": "medium",
            "deadline": "",
        },
        {
            "schemeName": "Stand-Up India Scheme",
            "ministry": "Ministry of Finance",
            "category": "business",
            "description": (
                "Facilitates bank loans between ₹10 lakh and ₹1 crore to at least one SC/ST "
                "borrower and one woman borrower per bank branch for greenfield enterprises."
            ),
            "eligibility": "SC/ST and women entrepreneurs setting up greenfield enterprises.",
            "benefit": "Bank loans ₹10 lakh to ₹1 crore for greenfield projects.",
            "applicationProcess": "Apply at any scheduled commercial bank or via standupmitra.in.",
            "officialLink": "https://www.standupmitra.in",
            "relevanceScore": 65,
            "relevanceReason": "Relevant for entrepreneurs in any profession.",
            "priority": "medium",
            "deadline": "",
        },
        {
            "schemeName": "PM Kaushal Vikas Yojana (PMKVY)",
            "ministry": "Ministry of Skill Development and Entrepreneurship",
            "category": "employment",
            "description": (
                "Free skill training and certification programme. Provides short-term training "
                "in over 300 job roles across multiple sectors with placement assistance."
            ),
            "eligibility": "Indian citizens aged 15-45 seeking skill development.",
            "benefit": "Free training + certification + monetary reward on completion.",
            "applicationProcess": "Locate a PMKVY training centre at pmkvyofficial.org.",
            "officialLink": "https://pmkvyofficial.org",
            "relevanceScore": 60,
            "relevanceReason": "Skill upgradation is beneficial for any profession.",
            "priority": "low",
            "deadline": "",
        },
    ]


# ── Core Functions ────────────────────────────────────────────────────────────

def get_profession_recommendations(
    uid: str,
    profession: str,
    state: str,
    income: str = "",
) -> Dict[str, Any]:
    """
    Generate AI-matched scheme recommendations for the user's profession.
    Saves results to Firestore and returns them.
    """
    # Fetch existing applied scheme names to avoid duplication
    existing_apps = list(get_col("applications").where("userId", "==", uid).stream())
    existing_scheme_names = [d.to_dict().get("schemeName", "") for d in existing_apps]

    client = get_gemini_client()
    recommendations: List[Dict[str, Any]]

    if client:
        try:
            prompt = _build_recommendation_prompt(profession, state, income, existing_scheme_names)
            response = client.models.generate_content(
                model="gemini-flash-lite-latest",
                contents=prompt,
            )
            raw = response.text.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            recommendations = json.loads(raw.strip())
            logger.info(f"[SchemeNotifications] Gemini generated {len(recommendations)} recs for {profession}.")
        except Exception as exc:
            logger.error(f"[SchemeNotifications] Gemini error ({exc}); using mock.")
            recommendations = _mock_recommendations(profession, state)
    else:
        logger.warning("[SchemeNotifications] Gemini unavailable; using mock.")
        recommendations = _mock_recommendations(profession, state)

    # Persist notifications to Firestore (replace old ones for this user)
    _clear_old_notifications(uid)
    now = datetime.utcnow().isoformat()
    expires = (datetime.utcnow() + timedelta(days=30)).isoformat()
    saved = []
    for rec in recommendations:
        notif_id = str(uuid.uuid4())
        doc = {
            "userId": uid,
            "professionTarget": profession,
            "isRead": False,
            "createdAt": now,
            "expiresAt": expires,
            **rec,
        }
        get_col(NOTIFICATIONS_COLLECTION).document(notif_id).set(doc)
        doc["id"] = notif_id
        saved.append(doc)

    return {"recommendations": saved, "profession": profession, "state": state}


def _clear_old_notifications(uid: str) -> None:
    """Delete previous scheme notification docs for this user before regenerating."""
    docs = list(get_col(NOTIFICATIONS_COLLECTION).where("userId", "==", uid).stream())
    for d in docs:
        d.reference.delete()


def get_notifications(uid: str) -> List[Dict[str, Any]]:
    docs = list(get_col(NOTIFICATIONS_COLLECTION).where("userId", "==", uid).stream())
    result = []
    for d in docs:
        data = d.to_dict() or {}
        data["id"] = d.id
        result.append(data)
    result.sort(key=lambda x: x.get("relevanceScore", 0), reverse=True)
    return result


def mark_read(uid: str, notif_id: str) -> bool:
    doc = get_col(NOTIFICATIONS_COLLECTION).document(notif_id).get()
    if not doc.exists or doc.to_dict().get("userId") != uid:
        return False
    doc.reference.update({"isRead": True})
    return True


def mark_all_read(uid: str) -> int:
    docs = list(get_col(NOTIFICATIONS_COLLECTION).where("userId", "==", uid).stream())
    count = 0
    for d in docs:
        d.reference.update({"isRead": True})
        count += 1
    return count


# ── Preferences ───────────────────────────────────────────────────────────────

def get_preferences(uid: str) -> Dict[str, Any]:
    doc = get_col(PREFERENCES_COLLECTION).document(uid).get()
    if not doc.exists:
        return {
            "userId": uid,
            "enabledCategories": list(_PROFESSION_CATEGORIES.keys()),
            "pushEnabled": True,
            "emailEnabled": False,
        }
    data = doc.to_dict() or {}
    data["id"] = uid
    return data


def save_preferences(uid: str, prefs: Dict[str, Any]) -> Dict[str, Any]:
    prefs["userId"] = uid
    prefs["updatedAt"] = datetime.utcnow().isoformat()
    get_col(PREFERENCES_COLLECTION).document(uid).set(prefs, merge=True)
    return get_preferences(uid)
