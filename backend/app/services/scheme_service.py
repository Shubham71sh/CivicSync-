"""
Scheme service — Firestore-based schemes, benefits, eligibility.
"""

import asyncio
import uuid
import logging
from datetime import datetime
from fastapi import HTTPException
from app.config.database import get_col, doc_to_dict, docs_to_list

logger = logging.getLogger("uvicorn.error")


# ─── Scheme Finder ────────────────────────────────────────────────────────────

async def get_all_schemes(query: dict = None) -> dict:
    loop = asyncio.get_event_loop()

    def _fetch():
        ref = get_col("schemes")
        docs = list(ref.stream())
        return docs

    docs = await loop.run_in_executor(None, _fetch)
    schemes = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        schemes.append(d)

    # Filter in memory (Firestore free tier doesn't support complex queries well)
    q = query or {}
    keyword = (q.get("keyword") or "").lower()
    category = q.get("category", "")
    state = q.get("state", "")

    if keyword:
        schemes = [s for s in schemes if keyword in (s.get("name", "") + s.get("description", "")).lower()]
    if category:
        schemes = [s for s in schemes if s.get("category", "").lower() == category.lower()]
    if state:
        schemes = [s for s in schemes if state.lower() in (s.get("state", "") + s.get("eligibility", "")).lower()]

    # Pagination
    page = int(q.get("page", 1))
    limit = int(q.get("limit", 10))
    total = len(schemes)
    start = (page - 1) * limit
    paginated = schemes[start:start + limit]

    return {
        "schemes": paginated,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


async def get_scheme_by_id(scheme_id: str) -> dict:
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("schemes").document(scheme_id).get())
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    data = doc.to_dict()
    data["id"] = doc.id
    return {"scheme": data}


# ─── Benefits / Applications ──────────────────────────────────────────────────

async def get_recommended(uid: str):
    loop = asyncio.get_event_loop()

    def _fetch():
        return list(get_col("schemes").stream())

    docs = await loop.run_in_executor(None, _fetch)

    schemes = []

    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        schemes.append(data)

    return {
        "recommended": schemes
    }


async def apply_for_benefit(uid: str, scheme_id: str, scheme_name: str, notes: str = "") -> dict:
    loop = asyncio.get_event_loop()

    # Check if already applied
    existing = await loop.run_in_executor(None, lambda: list(
        get_col("applications")
        .where("userId", "==", uid)
        .where("schemeId", "==", scheme_id)
        .stream()
    ))
    if existing:
        d = existing[0].to_dict()
        d["id"] = existing[0].id
        return {"application": d, "message": "Already applied for this scheme."}

    now = datetime.utcnow().isoformat()
    app_id = str(uuid.uuid4())
    app_data = {
        "userId": uid,
        "schemeId": scheme_id,
        "schemeName": scheme_name,
        "notes": notes,
        "status": "pending",
        "createdAt": now,
        "updatedAt": now,
    }
    await loop.run_in_executor(None, lambda: get_col("applications").document(app_id).set(app_data))
    app_data["id"] = app_id

    # Create notification
    notif_id = str(uuid.uuid4())
    await loop.run_in_executor(None, lambda: get_col("notifications").document(notif_id).set({
        "userId": uid,
        "title": "Application Submitted",
        "message": f"Your application for {scheme_name} has been submitted.",
        "type": "application",
        "read": False,
        "createdAt": now,
    }))

    return {"application": app_data}

async def check_eligibility(
    uid: str,
    scheme_id: str,
    damage_percent: int
):

    loop = asyncio.get_event_loop()

    scheme_doc = await loop.run_in_executor(
        None,
        lambda: get_col("schemes").document(scheme_id).get()
    )

    if not scheme_doc.exists:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    scheme = scheme_doc.to_dict()

    

    if damage_percent >= 70:
        return {
            "eligibility": {
                "is_eligible": True,
                "scheme_name": scheme.get("schemeName"),
                "reason": "Heavy structural damage detected by AI",

                "amount": "₹95,100",
                "department": "Ministry of Home Affairs",
                "priority": "High",
                "confidence": 94,

                "benefits": [
                    "Financial Assistance",
                    "House Reconstruction",
                    "Medical Assistance",
                    "Food & Essential Supplies"
                ],

                "documents": [
                    "Aadhaar Card",
                    "Bank Passbook",
                    "Damage Photos",
                    "Residence Proof"
                ],

                "timeline": "7-14 Days",

                "status": "Approved for Application"
            }
        }

    elif damage_percent >= 40:
        return {
            "eligibility": {
                "is_eligible": True,
                "scheme_name": scheme.get("schemeName"),
                "reason": "Moderate damage detected",

                "amount": "₹50,000",
                "department": "State Disaster Management Authority",
                "priority": "Medium",
                "confidence": 89,

                "benefits": [
                    "Relief Assistance",
                    "House Repair",
                    "Food Support"
                ],

                "documents": [
                    "Aadhaar Card",
                    "Damage Photos",
                    "Bank Passbook"
                ],

                "timeline": "10-20 Days",

                "status": "Eligible"
            }
        }

    else:
        return {
            "eligibility": {
                "is_eligible": False,
                "scheme_name": "Not Eligible",
                "reason": "Damage below eligibility threshold",

                "amount": "₹0",
                "department": "-",
                "priority": "Low",
                "confidence": 98,

                "benefits": [],
                "documents": [],
                "timeline": "-",
                "status": "Rejected"
            }
        }


async def get_user_benefits(uid: str) -> dict:
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("applications").where("userId", "==", uid).stream()
    ))
    result = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        result.append(d)
    return {"benefits": result}


async def get_benefit_by_id(uid: str, benefit_id: str) -> dict:
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("applications").document(benefit_id).get())
    if not doc.exists or doc.to_dict().get("userId") != uid:
        raise HTTPException(status_code=404, detail="Benefit not found.")
    data = doc.to_dict()
    data["id"] = doc.id
    return {"benefit": data}


async def update_benefit_status(uid: str, benefit_id: str, new_status: str) -> dict:
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("applications").document(benefit_id).get())
    if not doc.exists or doc.to_dict().get("userId") != uid:
        raise HTTPException(status_code=404, detail="Benefit not found.")
    await loop.run_in_executor(None, lambda: get_col("applications").document(benefit_id).update({
        "status": new_status,
        "updatedAt": datetime.utcnow().isoformat(),
    }))
    updated = await loop.run_in_executor(None, lambda: get_col("applications").document(benefit_id).get())
    data = updated.to_dict()
    data["id"] = benefit_id
    return {"benefit": data}
