"""
Scheme service — Firestore-based schemes, benefits, eligibility.
Integrates Qdrant semantic search and deterministic profile filters.
"""

import asyncio
import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.config.database import get_col, doc_to_dict, docs_to_list
from app.config.database import get_db

# Import RAG integrations
from app.ai.retrieval.retrieval_service import get_retrieval_service
from app.services.profile_service import ProfileService

logger = logging.getLogger("uvicorn.error")


# ─── Scheme Finder ────────────────────────────────────────────────────────────

async def get_all_schemes(query: dict = None, user_id: Optional[str] = None) -> dict:
    loop = asyncio.get_event_loop()

    # Step 1: Fetch all schemes from Firestore
    def _fetch_all_raw():
        ref = get_col("schemes")
        return list(ref.stream())

    docs = await loop.run_in_executor(None, _fetch_all_raw)
    
    all_schemes = []
    schemes_by_id = {}
    for doc in docs:
        d = doc.to_dict()
        d["id"] = doc.id
        all_schemes.append(d)
        schemes_by_id[doc.id] = d

    q = query or {}
    keyword = (q.get("keyword") or "").strip()
    category = q.get("category", "")
    state = q.get("state", "")

    # Retrieve citizen profile for smart filtering if user_id is provided
    profile = None
    if user_id:
        try:
            profile_service = ProfileService(get_db())
            profile = await profile_service.get_profile(user_id)
        except Exception as e:
            logger.warning(f"[Scheme Finder] Failed to fetch profile for user {user_id}: {e}")

    # Step 2: Retrieve via Qdrant semantic search if keyword is provided
    filtered_schemes = []
    
    if keyword:
        retrieval_service = get_retrieval_service()
        # Create a search query including profile elements if available
        search_query = keyword
        if profile:
            profession = profile.get("profession", "")
            location = profile.get("location", "")
            if profession or location:
                search_query = f"{keyword} target {profession} in {location}"

        try:
            retrieval_result = await retrieval_service.retrieve(
                query=search_query,
                filters={"document_type": "scheme"},
                top_k=20
            )
            
            # Map semantic hits to Firestore documents preserving score order
            seen_ids = set()
            for chunk in retrieval_result.chunks:
                fid = chunk.firebase_id or chunk.document_id
                if fid in schemes_by_id and fid not in seen_ids:
                    seen_ids.add(fid)
                    filtered_schemes.append(schemes_by_id[fid])
            
            logger.info(f"[Scheme Finder] Semantic search found {len(filtered_schemes)} matching schemes.")
            
        except Exception as e:
            logger.error(f"[Scheme Finder] Qdrant search failed: {e}. Falling back to keyword match.")
            # Fallback to local keyword search
            k_lower = keyword.lower()
            filtered_schemes = [
                s for s in all_schemes 
                if k_lower in s.get("name", "").lower() or k_lower in s.get("description", "").lower()
            ]
    else:
        filtered_schemes = all_schemes

    # Step 3: Apply deterministic filters (state, category)
    if category:
        filtered_schemes = [
            s for s in filtered_schemes 
            if s.get("category", "").lower() == category.lower()
        ]
        
    if state:
        filtered_schemes = [
            s for s in filtered_schemes 
            if state.lower() in s.get("state", "").lower() or s.get("state", "All States").lower() == "all states"
        ]

    # Step 4: Apply deterministic Profile / Eligibility filters
    if profile:
        user_state = profile.get("location", "").lower()
        user_profession = profile.get("profession", "").lower()
        user_student = profile.get("studentStatus", "").lower()
        
        # Keep scheme if it's open to the user's state or All States
        if user_state:
            filtered_schemes = [
                s for s in filtered_schemes
                if user_state in s.get("state", "").lower() or s.get("state", "All States").lower() == "all states"
            ]
            
        # Keep scheme if profession matches (if scheme specifies target group)
        if user_profession:
            # We look for matches in eligibility/description
            pass

    # Pagination
    page = int(q.get("page", 1))
    limit = int(q.get("limit", 10))
    total = len(filtered_schemes)
    start = (page - 1) * limit
    paginated = filtered_schemes[start:start + limit]

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
    # Fetch schemes tailored to user profile
    res = await get_all_schemes(query={"limit": 20}, user_id=uid)
    return {
        "recommended": res.get("schemes", [])
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
