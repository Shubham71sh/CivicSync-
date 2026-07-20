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

async def get_recommended(uid: str) -> dict:
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("recommendations").where("userId", "==", uid).stream()
    ))
    result = []
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        result.append(d)
    return {"recommended": result}


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


async def check_eligibility(uid: str, scheme_id: str) -> dict:
    loop = asyncio.get_event_loop()

    def _fetch():
        citizen = get_col("citizens").document(uid).get()
        scheme = get_col("schemes").document(scheme_id).get()
        return citizen, scheme

    citizen_doc, scheme_doc = await loop.run_in_executor(None, _fetch)

    citizen = citizen_doc.to_dict() if citizen_doc.exists else {}
    if not scheme_doc.exists:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    scheme = scheme_doc.to_dict()

    # Simple scoring
    score = 60
    reasons = []
    eligibility_text = (scheme.get("eligibility") or "").lower()

    if citizen.get("category") and citizen["category"].lower() in eligibility_text:
        score += 10
        reasons.append(f"Your category ({citizen['category']}) matches.")
    if citizen.get("state") and citizen["state"].lower() in eligibility_text:
        score += 10
        reasons.append(f"Your state ({citizen['state']}) is eligible.")
    if citizen.get("occupation") and citizen["occupation"].lower() in eligibility_text:
        score += 10
        reasons.append(f"Your occupation matches.")

    return {
        "eligible": score >= 60,
        "score": min(score, 100),
        "reasons": reasons,
        "scheme": {**scheme, "id": scheme_id},
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
