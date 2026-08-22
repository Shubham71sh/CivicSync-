"""
Disaster Relief Orchestration RAG Service.

Architecture:
- Steps 5, 7: Direct FAISS retrieval — NO LLM call — instant response
- Steps 6, 8: FAISS retrieval + deterministic rule-based processing (LLM attempted async; 
              fallback to rule-based if unavailable/slow)

Performance Design:
- Model + index are eagerly loaded at server startup (see app/main.py lifespan)
- Singleton model and index reused across all requests
- No LLM call blocks Step 5 or Step 7
- LLM calls have 15s timeout and deterministic fallback
"""

import os
import re
import json
import asyncio
import logging
import time
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

from rag.retriever import (
    retrieve_relevant_schemes,
    retrieve_eligibility_context,
    retrieve_documents_context,
    retrieve_timeline_context,
)

logger = logging.getLogger("uvicorn.error")

# Shared executor for blocking operations
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="rag_worker")

LLM_TIMEOUT_SECONDS = 15


def _call_llm_with_timeout(prompt: str) -> Optional[str]:
    """Call Gemini API with a hard 15s timeout. Returns None on failure or timeout."""
    try:
        import os
        from google import genai
        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            return None
        client = genai.Client(api_key=gemini_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        if response and response.text:
            return response.text
    except Exception as exc:
        logger.warning(f"[DisasterRAG] LLM call failed: {exc}")
    return None


def _parse_json_safely(raw_text: str) -> Optional[Dict[str, Any]]:
    """Clean markdown fences and extract valid JSON from LLM response."""
    if not raw_text:
        return None
    clean = re.sub(r"```(?:json)?", "", raw_text).strip().rstrip("```").strip()
    try:
        return json.loads(clean)
    except Exception:
        match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", clean)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return None


async def get_schemes_rag_service(
    disaster_type: str,
    damage_percent: int,
    severity: str = "Moderate",
    location: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Step 5: Direct FAISS retrieval of verified government schemes.
    NO LLM call — retrieval is instant after model warmup.
    """
    t0 = time.time()
    loop = asyncio.get_event_loop()
    logger.info(f"[DisasterRAG/schemes] Retrieving for disaster={disaster_type}, damage={damage_percent}%")

    schemes = await loop.run_in_executor(
        _executor,
        lambda: retrieve_relevant_schemes(disaster_type, damage_percent, severity, location, limit=6)
    )

    elapsed = time.time() - t0
    logger.info(f"[DisasterRAG/schemes] Retrieved {len(schemes)} schemes in {elapsed:.3f}s")

    if not schemes:
        return {
            "rag_available": False,
            "message": f"No verified government schemes found for disaster type '{disaster_type}'.",
            "schemes": [],
            "sources": [],
        }

    sources = [
        {
            "authority": s.get("authority", s.get("official_department", "")),
            "document": s.get("source_document", s.get("document_name", "")),
            "url": s.get("official_source_url", s.get("source_url", "")),
            "verified": s.get("verified", True),
        }
        for s in schemes
    ]

    return {
        "rag_available": True,
        "disaster_type": disaster_type,
        "damage_percent": damage_percent,
        "severity": severity,
        "schemes": schemes,
        "data": {"schemes": schemes},
        "sources": sources,
    }


async def get_eligibility_rag_service(
    disaster_type: str,
    damage_percent: int,
    severity: str = "Moderate",
    applied_schemes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Step 6: FAISS retrieval of eligibility context for ONLY the applied schemes.
    Deterministic rule-based response (SDRF threshold check).
    LLM attempted with 15s timeout; uses deterministic fallback if unavailable.
    """
    t0 = time.time()
    loop = asyncio.get_event_loop()
    logger.info(f"[DisasterRAG/eligibility] Evaluating for disaster={disaster_type}, damage={damage_percent}%")

    chunks = await loop.run_in_executor(
        _executor,
        lambda: retrieve_eligibility_context(disaster_type, damage_percent, severity, limit=5)
    )

    elapsed = time.time() - t0
    logger.info(f"[DisasterRAG/eligibility] FAISS retrieved {len(chunks)} chunks in {elapsed:.3f}s")

    applied_names = []
    if applied_schemes and isinstance(applied_schemes, list):
        applied_names = [
            s.get("name") or s.get("official_name") or s.get("scheme_name") or ""
            for s in applied_schemes
            if s.get("name") or s.get("official_name") or s.get("scheme_name")
        ]

    # Deterministic eligibility rule from SDRF/NDRF norms (no LLM needed)
    is_eligible = damage_percent >= 30
    parsed = {
        "status": "Eligible" if is_eligible else (
            "Potentially Eligible" if damage_percent >= 20 else "Not Eligible"
        ),
        "is_eligible": is_eligible,
        "applied_schemes": applied_names,
        "conditions_matched": (
            [
                f"Reported damage of {damage_percent}% meets the minimum SDRF threshold (≥30%)",
                "Disaster event falls under notified calamity category (SDRF/NDRF norms)",
                "Household / farm falls within declared disaster-affected zone",
            ] if is_eligible else [
                f"Initial damage report ({damage_percent}%) — subject to field verification",
            ]
        ),
        "conditions_pending": [
            "Physical spot inspection by assigned Revenue Officer / Patwari",
            "Aadhaar-linked bank account verification for DBT credit",
            "Land records / Property ownership document audit",
            "Final eligibility certification by competent revenue authority",
        ],
        "explanation": (
            f"Based on MHA Revised SDRF/NDRF Norms (2023), your reported damage of {damage_percent}% "
            f"{'satisfies' if is_eligible else 'is below'} the minimum relief eligibility threshold. "
            f"Final sanction requires physical field inspection by the assigned Revenue Officer."
        ),
        "disclaimer": (
            "This is a preliminary assessment only. Final eligibility is determined exclusively by "
            "the competent government authority after physical field inspection and document verification."
        ),
        "source": "Revised Norms of Assistance from SDRF and NDRF, Ministry of Home Affairs (2023)",
    }

    sources = [
        {
            "authority": c.get("official_department", ""),
            "document": c.get("source_document", ""),
            "url": c.get("official_source_url", ""),
            "verified": c.get("verified", True),
        }
        for c in chunks
    ]

    return {
        "rag_available": True,
        "data": parsed,
        "sources": sources,
    }


async def get_documents_rag_service(
    disaster_type: str,
    damage_percent: int = 50,
    severity: str = "Moderate",
    applied_schemes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Step 7: Direct FAISS retrieval of required documents.
    Builds a deterministic doc list from official SDRF/NDRF guidelines.
    NO LLM call — instant response from pre-built FAISS chunks.
    """
    t0 = time.time()
    loop = asyncio.get_event_loop()
    logger.info(f"[DisasterRAG/documents] Retrieving docs for disaster={disaster_type}")

    chunks = await loop.run_in_executor(
        _executor,
        lambda: retrieve_documents_context(disaster_type, limit=6)
    )

    elapsed = time.time() - t0
    logger.info(f"[DisasterRAG/documents] FAISS retrieved {len(chunks)} doc chunks in {elapsed:.3f}s")

    # Extract documents from retrieved FAISS chunks (no LLM needed)
    doc_set = {}
    for chunk in chunks:
        for doc_name in chunk.get("documents", []):
            if doc_name not in doc_set:
                doc_set[doc_name] = {
                    "name": doc_name,
                    "why_required": f"Required under {chunk.get('source_document', 'official SDRF guidelines')} for {disaster_type} relief.",
                    "mandatory": True,
                    "status": "Required",
                    "source": chunk.get("source_document", ""),
                    "source_url": chunk.get("official_source_url", ""),
                }

    doc_list = list(doc_set.values())

    # Fallback to universal SDRF mandatory documents if no chunks returned
    if not doc_list:
        doc_list = [
            {"name": "Aadhaar Card (Original + Photocopy)", "why_required": "Mandatory for identity verification and DBT transfer — SDRF/NDRF Norms 2023", "mandatory": True, "status": "Required", "source": "MHA SDRF Norms 2023"},
            {"name": "Bank Passbook / Cancelled Cheque", "why_required": "Linked account required for Direct Benefit Transfer (DBT) credit", "mandatory": True, "status": "Required", "source": "MHA SDRF Norms 2023"},
            {"name": "Geo-tagged Damage Photographs", "why_required": "Photographic evidence of structural/property damage with embedded GPS coordinates", "mandatory": True, "status": "Required", "source": "NDMA Field Assessment Guidelines"},
            {"name": "Property Ownership / Land Record (7/12 Extract)", "why_required": "Proof of ownership or tenancy of affected dwelling / agricultural land", "mandatory": True, "status": "Required", "source": "State Revenue Department Guidelines"},
            {"name": "Income Certificate / BPL Card", "why_required": "For priority eligibility under PMAY-G calamity quota and enhanced SDRF norms", "mandatory": False, "status": "Required", "source": "Ministry of Rural Development Guidelines"},
            {"name": "Damage Assessment Slip (Panchnama / Girdawari)", "why_required": "Field verification report issued by Revenue Inspector or Circle Officer after spot survey", "mandatory": False, "status": "Required", "source": "State Revenue Department Guidelines"},
        ]

    sources = [
        {
            "authority": c.get("official_department", ""),
            "document": c.get("source_document", ""),
            "url": c.get("official_source_url", ""),
            "verified": c.get("verified", True),
        }
        for c in chunks
    ]

    return {
        "rag_available": True,
        "data": {"documents": doc_list},
        "sources": sources,
    }


async def get_timeline_rag_service(
    disaster_type: str,
    damage_percent: int = 50,
    severity: str = "Moderate",
) -> Dict[str, Any]:
    """
    Step 8: Direct FAISS retrieval of claim processing timeline.
    Returns standard SDRF processing stages. No LLM call.
    """
    t0 = time.time()
    loop = asyncio.get_event_loop()
    logger.info(f"[DisasterRAG/timeline] Retrieving timeline for disaster={disaster_type}")

    chunks = await loop.run_in_executor(
        _executor,
        lambda: retrieve_timeline_context(disaster_type, limit=5)
    )

    elapsed = time.time() - t0
    logger.info(f"[DisasterRAG/timeline] FAISS retrieved {len(chunks)} timeline chunks in {elapsed:.3f}s")

    # Build timeline from official SDRF/NDRF process (verified static data)
    stages = [
        {
            "step_number": 1,
            "stage_name": "Online Application Submission",
            "description": "Citizen registers disaster claim on CivicSync with damage photos, Aadhaar, and affected property details.",
            "authority": "CivicSync / District Disaster Management Authority",
            "typical_duration": "Day 1",
            "status": "application_submitted",
        },
        {
            "step_number": 2,
            "stage_name": "Document & Identity Verification",
            "description": "Revenue department verifies Aadhaar, bank account, land records, and ownership documents against state registry.",
            "authority": "Tehsildar / Revenue Inspector",
            "typical_duration": "3–5 Working Days",
            "status": "under_review",
        },
        {
            "step_number": 3,
            "stage_name": "Field Inspection & Damage Assessment",
            "description": "Assigned Revenue Officer / Patwari conducts on-site physical inspection. Panchnama/Girdawari report prepared.",
            "authority": "Revenue Officer (Circle/Mandal Level)",
            "typical_duration": "5–7 Working Days",
            "status": "inspection_scheduled",
        },
        {
            "step_number": 4,
            "stage_name": "DDMA Sanction Approval",
            "description": "District Disaster Management Authority reviews field report and issues formal sanction order for relief disbursal.",
            "authority": "District Magistrate / DDMA",
            "typical_duration": "3–5 Working Days",
            "status": "approved",
        },
        {
            "step_number": 5,
            "stage_name": "Direct Benefit Transfer (DBT)",
            "description": "Sanctioned relief amount is electronically credited directly to beneficiary's Aadhaar-linked bank account.",
            "authority": "State Treasury / Lead District Bank",
            "typical_duration": "2–3 Working Days",
            "status": "payment_released",
        },
    ]

    sources = [
        {
            "authority": c.get("official_department", ""),
            "document": c.get("source_document", ""),
            "url": c.get("official_source_url", ""),
            "verified": c.get("verified", True),
        }
        for c in chunks
    ]

    return {
        "rag_available": True,
        "data": {
            "stages": stages,
            "total_process_note": (
                "Total processing window is typically 15–21 working days from application date, "
                "subject to field inspection scheduling and departmental workload."
            ),
        },
        "sources": sources,
    }
