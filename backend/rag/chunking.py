"""
Disaster Relief Document Chunking Service.

Breaks down official disaster schemes into discrete semantic chunks tailored for:
- Step 5: Schemes Overview & Relief Benefits
- Step 6: Eligibility Criteria & Conditions
- Step 7: Required Documents & Verification Rules
- Step 8: Claim Timeline & Application Procedures
"""

from typing import List, Dict, Any


def chunk_scheme(scheme: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert a single official scheme into multiple category-specific chunks with rich metadata."""
    chunks = []
    base_id = scheme["id"]
    name = scheme["scheme_name"]
    dept = scheme["official_department"]
    disaster = scheme["disaster_type"]
    scope = scheme.get("scope", "Central & State")
    source_url = scheme.get("official_source_url", "")
    source_doc = scheme.get("source_document", "")
    verified = scheme.get("verified", True)

    # 1. Scheme Overview Chunk (Targeted for Step 5 Schemes)
    overview_text = (
        f"Government Scheme: {name}\n"
        f"Department: {dept}\n"
        f"Disaster Type: {disaster}\n"
        f"Scope: {scope}\n"
        f"Relief Quantum / Amount: {scheme.get('relief_amount', '')}\n"
        f"Eligibility Overview: {scheme.get('eligibility', '')}\n"
        f"Key Benefits: {', '.join(scheme.get('benefits', []))}\n"
        f"Official Source: {source_doc} ({source_url})"
    )
    chunks.append({
        "chunk_id": f"{base_id}-OVERVIEW",
        "scheme_id": base_id,
        "category": "schemes",
        "disaster_type": disaster,
        "scheme_name": name,
        "official_department": dept,
        "title": f"{name} — Overview & Benefits",
        "text": overview_text,
        "min_damage": scheme.get("min_damage", 30),
        "max_damage": scheme.get("max_damage", 100),
        "relief_amount": scheme.get("relief_amount", ""),
        "benefits": scheme.get("benefits", []),
        "required_documents": scheme.get("required_documents", []),
        "official_source_url": source_url,
        "source_document": source_doc,
        "verified": verified,
        "processing_days": scheme.get("processing_days", 14),
    })

    # 2. Eligibility Chunk (Targeted for Step 6 Eligibility)
    eligibility_text = (
        f"Scheme: {name}\n"
        f"Applicable Disaster: {disaster}\n"
        f"Min Damage Required: {scheme.get('min_damage', 30)}%\n"
        f"Eligibility Criteria: {scheme.get('eligibility', '')}\n"
        f"Department Responsible: {dept}\n"
        f"Official Verification Norms: Under {source_doc}, final eligibility is certified by competent field revenue authorities."
    )
    chunks.append({
        "chunk_id": f"{base_id}-ELIGIBILITY",
        "scheme_id": base_id,
        "category": "eligibility",
        "disaster_type": disaster,
        "scheme_name": name,
        "official_department": dept,
        "title": f"{name} — Eligibility Criteria",
        "text": eligibility_text,
        "min_damage": scheme.get("min_damage", 30),
        "max_damage": scheme.get("max_damage", 100),
        "eligibility_summary": scheme.get("eligibility", ""),
        "official_source_url": source_url,
        "source_document": source_doc,
        "verified": verified,
    })

    # 3. Documents Chunk (Targeted for Step 7 Documents)
    docs_list = scheme.get("required_documents", [])
    docs_text = (
        f"Required Documentation for {name} ({disaster} relief):\n"
        f"Department: {dept}\n"
        f"Mandatory Documents Required by Official Guidelines:\n"
        + "\n".join([f"- {d}" for d in docs_list])
        + f"\nSource Document: {source_doc} ({source_url})"
    )
    chunks.append({
        "chunk_id": f"{base_id}-DOCUMENTS",
        "scheme_id": base_id,
        "category": "documents",
        "disaster_type": disaster,
        "scheme_name": name,
        "official_department": dept,
        "title": f"{name} — Required Documents",
        "text": docs_text,
        "documents": docs_list,
        "official_source_url": source_url,
        "source_document": source_doc,
        "verified": verified,
    })

    # 4. Timeline & Process Chunk (Targeted for Step 8 Timeline)
    process_text = (
        f"Claim Submission & Inspection Process for {name}:\n"
        f"Responsible Authority: {dept}\n"
        f"Official Application Process:\n{scheme.get('application_process', '')}\n"
        f"Typical Processing Window: {scheme.get('processing_days', 14)} working days.\n"
        f"Source: {source_doc}"
    )
    chunks.append({
        "chunk_id": f"{base_id}-TIMELINE",
        "scheme_id": base_id,
        "category": "timeline",
        "disaster_type": disaster,
        "scheme_name": name,
        "official_department": dept,
        "title": f"{name} — Claim Processing Timeline & Stages",
        "text": process_text,
        "application_process": scheme.get("application_process", ""),
        "processing_days": scheme.get("processing_days", 14),
        "official_source_url": source_url,
        "source_document": source_doc,
        "verified": verified,
    })

    return chunks


def chunk_all_official_schemes(schemes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process all schemes and return a flat list of semantic chunks."""
    all_chunks = []
    for s in schemes:
        all_chunks.extend(chunk_scheme(s))
    return all_chunks
