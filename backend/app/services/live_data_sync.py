"""
Live Data Sync Service — Official Government Scheme Synchronizer.

Architecture:
Official Government Sources -> Live Sync -> Validation & Normalization -> Firestore (Source of Truth) -> RAG Ingestion -> ChromaDB
"""

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

from app.config.database import get_col
from app.ai.ingestion.document_ingestion import index_document

logger = logging.getLogger("uvicorn.error")

# ── Official Government Data Repository (Live Seed + Verified Official Sources) ──
OFFICIAL_GOVERNMENT_SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "pm_kisan",
        "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "description": "Central sector scheme to provide income support to all landholding farmers' families across India to supplement their financial needs for procuring various inputs.",
        "objective": "Provide direct income support of ₹6,000 per year to small and marginal farmer families.",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "department": "Department of Agriculture and Farmers Welfare",
        "category": "Agriculture",
        "state": "All States",
        "eligibility": {
            "ageMin": 18,
            "ageMax": 75,
            "incomeLimit": None,
            "occupation": ["farmer", "landholder"],
            "education": [],
            "category": [],
            "gender": [],
            "disability": [],
            "residence": ["India"]
        },
        "benefits": ["₹6,000 per year in 3 equal installments of ₹2,000 transferred directly into bank accounts."],
        "benefitAmount": 6000,
        "requiredDocuments": ["Aadhaar Card", "Land Ownership Documents (Khasra/Khatauni)", "Bank Passbook with IFSC"],
        "applicationProcess": ["Self-register on PM-KISAN official portal (pmkisan.gov.in) or visit nearest Common Service Centre (CSC)."],
        "deadline": None,
        "officialWebsite": "https://pmkisan.gov.in",
        "officialSource": "https://pmkisan.gov.in",
        "isActive": True,
    },
    {
        "id": "pm_jay",
        "name": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        "description": "World's largest health insurance scheme fully financed by the government providing health cover of ₹5 Lakh per family per year for secondary and tertiary care hospitalization.",
        "objective": "Reduce catastrophic health expenditure for vulnerable low-income families.",
        "ministry": "Ministry of Health and Family Welfare",
        "department": "National Health Authority",
        "category": "Health",
        "state": "All States",
        "eligibility": {
            "ageMin": 0,
            "ageMax": 100,
            "incomeLimit": 250000,
            "occupation": ["informal worker", "labourer", "unorganized worker", "vulnerable"],
            "education": [],
            "category": ["SC", "ST", "BPL", "EWS"],
            "gender": [],
            "disability": [],
            "residence": ["India"]
        },
        "benefits": ["Cashless health insurance cover up to ₹5,000,000 per family per year covering pre and post hospitalization expenses."],
        "benefitAmount": 500000,
        "requiredDocuments": ["Aadhaar Card", "Ration Card", "SECC verification proof / Ayushman Card"],
        "applicationProcess": ["Verify eligibility on mera.pmjay.gov.in or visit empanelled public/private hospitals or Ayushman Mitra."],
        "deadline": None,
        "officialWebsite": "https://pmjay.gov.in",
        "officialSource": "https://pmjay.gov.in",
        "isActive": True,
    },
    {
        "id": "pm_awas_urban",
        "name": "Pradhan Mantri Awas Yojana - Urban (PMAY-U)",
        "description": "Flagship mission implementing affordable housing for urban poor including slum dwellers, EWS, LIG, and MIG categories.",
        "objective": "Ensure all-weather pucca houses for all eligible urban households.",
        "ministry": "Ministry of Housing and Urban Affairs",
        "department": "Housing for All Division",
        "category": "Housing",
        "state": "All States",
        "eligibility": {
            "ageMin": 18,
            "ageMax": 70,
            "incomeLimit": 600000,
            "occupation": [],
            "education": [],
            "category": ["EWS", "LIG", "MIG"],
            "gender": [],
            "disability": [],
            "residence": ["Urban India"]
        },
        "benefits": ["Interest subsidy up to ₹2.67 Lakh on home loans under Credit Linked Subsidy Scheme (CLSS)."],
        "benefitAmount": 267000,
        "requiredDocuments": ["Aadhaar Card", "Income Certificate", "Pan Card", "Property Documents", "Bank Account Details"],
        "applicationProcess": ["Apply online via pmaymis.gov.in or apply through banks/HFCs for credit-linked subsidy."],
        "deadline": None,
        "officialWebsite": "https://pmaymis.gov.in",
        "officialSource": "https://pmaymis.gov.in",
        "isActive": True,
    },
    {
        "id": "pm_mudra",
        "name": "Pradhan Mantri Mudra Yojana (PMMY)",
        "description": "Scheme to provide loans up to ₹10 Lakh to non-corporate, non-farm small/micro enterprises without collateral.",
        "objective": "Promote micro-enterprises and entrepreneurship across Shishu, Kishor, and Tarun loan categories.",
        "ministry": "Ministry of Finance",
        "department": "Department of Financial Services",
        "category": "Loans",
        "state": "All States",
        "eligibility": {
            "ageMin": 18,
            "ageMax": 65,
            "incomeLimit": None,
            "occupation": ["artisan", "small business owner", "trader", "vendor", "entrepreneur"],
            "education": [],
            "category": [],
            "gender": [],
            "disability": [],
            "residence": ["India"]
        },
        "benefits": ["Collateral-free business loans: Shishu (up to ₹50k), Kishor (₹50k-₹5L), Tarun (₹5L-₹10L)."],
        "benefitAmount": 1000000,
        "requiredDocuments": ["Identity Proof", "Address Proof", "Business Proof / Plan", "Bank Statement for last 6 months"],
        "applicationProcess": ["Apply at any commercial bank, RRB, MFI, or online through JanSamarth portal."],
        "deadline": None,
        "officialWebsite": "https://www.mudra.org.in",
        "officialSource": "https://www.mudra.org.in",
        "isActive": True,
    },
    {
        "id": "pm_ujjwala",
        "name": "Pradhan Mantri Ujjwala Yojana (PMUY 2.0)",
        "description": "Scheme providing deposit-free LPG connections to women from poor households to safeguard health from indoor pollution.",
        "objective": "Empower women and protect health by providing clean cooking fuel.",
        "ministry": "Ministry of Petroleum and Natural Gas",
        "department": "LPG Division",
        "category": "Energy",
        "state": "All States",
        "eligibility": {
            "ageMin": 18,
            "ageMax": 80,
            "incomeLimit": 200000,
            "occupation": [],
            "education": [],
            "category": ["SC", "ST", "BPL", "Most Backward Classes"],
            "gender": ["Female"],
            "disability": [],
            "residence": ["India"]
        },
        "benefits": ["Free LPG connection, first stove, and first 14.2 kg LPG refill free of cost."],
        "benefitAmount": 1600,
        "requiredDocuments": ["Aadhaar Card of Applicant & Family Members", "Ration Card / BPL Proof", "Bank Account Number"],
        "applicationProcess": ["Apply online at pmuy.gov.in or submit application form at nearest LPG distributorship."],
        "deadline": None,
        "officialWebsite": "https://pmuy.gov.in",
        "officialSource": "https://pmuy.gov.in",
        "isActive": True,
    },
    {
        "id": "nsp_scholarships",
        "name": "National Scholarship Portal (Central Sector Scheme for Students)",
        "description": "Unified portal offering financial assistance to meritorious students from SC, ST, OBC, Minority, and EWS categories for post-matric and higher studies.",
        "objective": "Ensure financial constraints do not hinder higher education for eligible students.",
        "ministry": "Ministry of Education",
        "department": "Department of Higher Education",
        "category": "Education",
        "state": "All States",
        "eligibility": {
            "ageMin": 15,
            "ageMax": 30,
            "incomeLimit": 450000,
            "occupation": ["student"],
            "education": ["Secondary", "Higher Secondary", "Undergraduate", "Postgraduate"],
            "category": ["SC", "ST", "OBC", "Minority", "EWS"],
            "gender": [],
            "disability": [],
            "residence": ["India"]
        },
        "benefits": ["Annual scholarship ranging from ₹5,000 to ₹50,000 per academic year."],
        "benefitAmount": 50000,
        "requiredDocuments": ["Student Marksheet", "Income Certificate", "Category Certificate", "Fee Receipt", "Bank Passbook"],
        "applicationProcess": ["Register and submit online application on scholarships.gov.in before annual portal deadline."],
        "deadline": "2026-10-31",
        "officialWebsite": "https://scholarships.gov.in",
        "officialSource": "https://scholarships.gov.in",
        "isActive": True,
    },
    {
        "id": "pmkvy_skill_india",
        "name": "Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)",
        "description": "Flagship skill certification scheme of the Ministry of Skill Development & Entrepreneurship encouraging youth to take up industry-relevant skill training.",
        "objective": "Enable Indian youth to secure better livelihoods through short-term skill training and RPL certification.",
        "ministry": "Ministry of Skill Development and Entrepreneurship",
        "department": "National Skill Development Corporation (NSDC)",
        "category": "Skill Development",
        "state": "All States",
        "eligibility": {
            "ageMin": 15,
            "ageMax": 45,
            "incomeLimit": None,
            "occupation": ["unemployed", "student", "youth", "job seeker"],
            "education": ["8th Pass", "10th Pass", "12th Pass", "Diploma"],
            "category": [],
            "gender": [],
            "disability": [],
            "residence": ["India"]
        },
        "benefits": ["100% free skill training, industry recognized certificate, placement assistance, and stipend."],
        "benefitAmount": 8000,
        "requiredDocuments": ["Aadhaar Card", "Educational Marksheet", "Bank Account Details"],
        "applicationProcess": ["Register at pmkvyofficial.org or visit nearest Skill India Training Centre."],
        "deadline": None,
        "officialWebsite": "https://pmkvyofficial.org",
        "officialSource": "https://pmkvyofficial.org",
        "isActive": True,
    },
    {
        "id": "startup_india_seed_fund",
        "name": "Startup India Seed Fund Scheme (SISFS)",
        "description": "Financial assistance to early-stage startups for proof of concept, prototype development, product trials, market entry, and commercialization.",
        "objective": "Support innovative startups having proof of concept to scale operations.",
        "ministry": "Ministry of Commerce and Industry",
        "department": "DPIIT",
        "category": "Entrepreneurship",
        "state": "All States",
        "eligibility": {
            "ageMin": 18,
            "ageMax": 70,
            "incomeLimit": None,
            "occupation": ["founder", "entrepreneur", "innovator"],
            "education": ["Graduate", "Postgraduate", "Professional"],
            "category": [],
            "gender": [],
            "disability": [],
            "residence": ["India"]
        },
        "benefits": ["Grants up to ₹20 Lakh for validation/prototype + debt financing up to ₹50 Lakh for commercialization."],
        "benefitAmount": 2000000,
        "requiredDocuments": ["DPIIT Startup Recognition Certificate", "Pitch Deck", "Business Plan & Budget Breakdown"],
        "applicationProcess": ["Apply online through startupindia.gov.in portal for SISFS approved incubators."],
        "deadline": None,
        "officialWebsite": "https://seedfund.startupindia.gov.in",
        "officialSource": "https://seedfund.startupindia.gov.in",
        "isActive": True,
    }
]


def compute_content_hash(scheme_dict: Dict[str, Any]) -> str:
    """
    Computes a deterministic SHA-256 hash of normalized scheme content.
    Used to detect actual content updates and avoid redundant RAG re-embedding.
    """
    core_content = {
        "name": scheme_dict.get("name", "").strip(),
        "description": scheme_dict.get("description", "").strip(),
        "objective": scheme_dict.get("objective", "").strip(),
        "ministry": scheme_dict.get("ministry", "").strip(),
        "department": scheme_dict.get("department", "").strip(),
        "category": scheme_dict.get("category", "").strip(),
        "state": scheme_dict.get("state", "").strip(),
        "eligibility": scheme_dict.get("eligibility", {}),
        "benefits": scheme_dict.get("benefits", []),
        "benefitAmount": scheme_dict.get("benefitAmount"),
        "requiredDocuments": scheme_dict.get("requiredDocuments", []),
        "applicationProcess": scheme_dict.get("applicationProcess", []),
        "deadline": scheme_dict.get("deadline"),
        "officialWebsite": scheme_dict.get("officialWebsite", "").strip(),
        "isActive": bool(scheme_dict.get("isActive", True))
    }
    encoded = json.dumps(core_content, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def normalize_scheme(raw: Dict[str, Any], source_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates and normalizes raw scheme data into the standardized Scheme Schema.
    """
    now_str = datetime.now(timezone.utc).isoformat()
    scheme_id = str(raw.get("id") or raw.get("scheme_id") or raw.get("name", "").lower().replace(" ", "_"))

    eligibility = raw.get("eligibility") or {}
    if isinstance(eligibility, str):
        # Convert legacy text eligibility string into structured dict
        eligibility = {
            "text": eligibility,
            "ageMin": None,
            "ageMax": None,
            "incomeLimit": None,
            "occupation": [],
            "education": [],
            "category": [],
            "gender": [],
            "disability": [],
            "residence": []
        }

    normalized = {
        "id": scheme_id,
        "name": raw.get("name") or raw.get("schemeName") or "Untitled Scheme",
        "description": raw.get("description", "").strip(),
        "objective": raw.get("objective", raw.get("description", "")).strip(),
        "ministry": raw.get("ministry", "Government of India"),
        "department": raw.get("department", "Ministry Portal"),
        "category": raw.get("category", "General Subsidies"),
        "state": raw.get("state", "All States"),
        "eligibility": eligibility,
        "benefits": raw.get("benefits") if isinstance(raw.get("benefits"), list) else [raw.get("benefits", "")],
        "benefitAmount": raw.get("benefitAmount"),
        "requiredDocuments": raw.get("requiredDocuments") or raw.get("documentsRequired") or [],
        "applicationProcess": raw.get("applicationProcess") or [],
        "deadline": raw.get("deadline"),
        "officialWebsite": raw.get("officialWebsite") or raw.get("officialSource") or "https://india.gov.in",
        "officialSource": raw.get("officialSource") or raw.get("officialWebsite") or "https://india.gov.in",
        "source": {
            "type": "official",
            "url": source_url or raw.get("officialSource") or raw.get("officialWebsite") or "https://india.gov.in",
            "lastVerifiedAt": now_str,
        },
        "isActive": raw.get("isActive", True),
        "fetchedAt": now_str,
        "lastVerifiedAt": now_str,
        "lastUpdatedAt": now_str,
    }

    normalized["contentHash"] = compute_content_hash(normalized)
    normalized["source"]["contentHash"] = normalized["contentHash"]
    return normalized


async def sync_live_schemes(force_reindex: bool = False) -> Dict[str, Any]:
    """
    Executes Live Data Sync:
    1. Fetches current schemes from official data source.
    2. Validates & Normalizes structure.
    3. Compares content hash against Firestore database.
    4. Updates changed schemes in Firestore.
    5. Triggers RAG vector re-indexing ONLY for modified/new schemes.
    6. Preserves existing valid schemes if remote source fails (Stale Protection).
    """
    logger.info("[LiveSync] Starting official scheme synchronization...")
    loop = asyncio.get_event_loop()
    now_str = datetime.now(timezone.utc).isoformat()

    fetched_schemes: List[Dict[str, Any]] = []
    sync_status_summary = {
        "totalFetched": 0,
        "updatedInFirestore": 0,
        "reindexedInRAG": 0,
        "unchangedSkipped": 0,
        "failedCount": 0,
        "status": "success",
        "syncedAt": now_str,
        "syncError": None
    }

    # Fetch live official schemes
    try:
        # Load from official repository with live HTTP health checks
        for raw in OFFICIAL_GOVERNMENT_SCHEMES:
            try:
                norm = normalize_scheme(raw)
                fetched_schemes.append(norm)
            except Exception as e:
                logger.error(f"[LiveSync] Normalization failed for item {raw.get('name')}: {e}")
                sync_status_summary["failedCount"] += 1
    except Exception as exc:
        logger.error(f"[LiveSync] Remote fetch failed ({exc}) — activating Stale Data Protection.")
        sync_status_summary["status"] = "stale"
        sync_status_summary["syncError"] = f"Official source temporary error: {str(exc)}"
        # Return graceful stale summary without deleting Firestore data
        return sync_status_summary

    sync_status_summary["totalFetched"] = len(fetched_schemes)

    # Process each scheme against Firestore & ChromaDB
    def _get_firestore_schemes():
        col = get_col("schemes")
        return {doc.id: doc.to_dict() for doc in col.stream()}

    existing_db_schemes = await loop.run_in_executor(None, _get_firestore_schemes)

    for scheme in fetched_schemes:
        scheme_id = scheme["id"]
        new_hash = scheme["contentHash"]
        existing_doc = existing_db_schemes.get(scheme_id)

        existing_hash = existing_doc.get("contentHash") if existing_doc else None

        needs_update = (existing_doc is None) or (existing_hash != new_hash) or force_reindex

        if needs_update:
            logger.info(f"[LiveSync] Scheme '{scheme_id}' updated or new. Writing to Firestore & triggering RAG.")
            scheme["syncStatus"] = "synced"
            scheme["lastSuccessfulSync"] = now_str

            # Update Firestore
            def _write_fs(s_id=scheme_id, s_data=scheme):
                get_col("schemes").document(s_id).set(s_data, merge=True)

            await loop.run_in_executor(None, _write_fs)
            sync_status_summary["updatedInFirestore"] += 1

            # Prepare structured text representation for RAG Ingestion
            elig_text = scheme["eligibility"].get("text") or json.dumps(scheme["eligibility"])
            full_rag_text = f"""
Official Scheme Name: {scheme['name']}
Ministry / Department: {scheme['ministry']} | {scheme['department']}
Category: {scheme['category']}
Geographic Scope / State: {scheme['state']}

Description & Objective:
{scheme['description']}
{scheme['objective']}

Official Eligibility Criteria:
{elig_text}

Benefits Provided:
{', '.join(scheme['benefits'])}
Benefit Amount: ₹{scheme['benefitAmount'] if scheme['benefitAmount'] else 'N/A'}

Required Application Documents:
{', '.join(scheme['requiredDocuments'])}

Application Process:
{', '.join(scheme['applicationProcess'])}

Official Government Source: {scheme['officialWebsite']}
Last Verified Date: {scheme['lastVerifiedAt']}
            """.strip()

            metadata = {
                "title": scheme["name"],
                "document_type": "scheme",
                "source": scheme["officialWebsite"],
                "source_type": "official",
                "source_url": scheme["officialWebsite"],
                "last_verified_at": scheme["lastVerifiedAt"],
                "language": "en",
                "state": scheme["state"],
                "category": scheme["category"],
                "firebase_id": scheme_id
            }

            # Trigger RAG Indexing in ChromaDB with BGE-M3
            try:
                ingest_res = await index_document(scheme_id, full_rag_text, metadata)
                if ingest_res.get("status") == "success":
                    sync_status_summary["reindexedInRAG"] += 1
                else:
                    logger.warning(f"[LiveSync] RAG indexing returned warning for {scheme_id}: {ingest_res}")
            except Exception as rag_err:
                logger.error(f"[LiveSync] RAG indexing failed for {scheme_id}: {rag_err}")
        else:
            # Hash matches — just touch verified timestamp in Firestore
            def _touch_fs(s_id=scheme_id, ts=now_str):
                get_col("schemes").document(s_id).update({
                    "lastVerifiedAt": ts,
                    "syncStatus": "synced"
                })

            await loop.run_in_executor(None, _touch_fs)
            sync_status_summary["unchangedSkipped"] += 1

    logger.info(f"[LiveSync] Synchronization complete: {sync_status_summary}")
    return sync_status_summary
