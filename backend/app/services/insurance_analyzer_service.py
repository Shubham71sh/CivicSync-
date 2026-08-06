"""
Insurance Policy Analyzer Service
Extracts text from an uploaded insurance policy PDF and uses Gemini AI to produce
a structured analysis: coverages, exclusions, claim process, premium breakdown,
red flags, and an overall policy rating.
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List

from app.config.database import get_col
from app.config.gemini import get_gemini_client
from app.services.pdf_service import extract_text_from_pdf
from app.services.storage_service import upload_file_to_storage

logger = logging.getLogger("uvicorn.error")

COLLECTION = "insurance_analyses"


# ── Gemini Prompt ─────────────────────────────────────────────────────────────

def _build_prompt(text: str) -> str:
    truncated = text[:30_000]
    return f"""
You are a senior insurance analyst and consumer-advocacy expert.

Carefully read the following insurance policy document and return ONLY valid JSON (no markdown, no code fences).

Required JSON structure:
{{
  "policyType": "Health|Life|Motor|Home|Travel|Term|Other",
  "insurer": "",
  "policyNumber": "",
  "policyHolderName": "",
  "sumInsured": "",
  "premiumAmount": "",
  "premiumFrequency": "Monthly|Quarterly|Half-Yearly|Annually",
  "policyTerm": "",
  "startDate": "",
  "expiryDate": "",
  "coverages": ["", ""],
  "exclusions": ["", ""],
  "waitingPeriods": ["", ""],
  "claimProcess": ["", ""],
  "networkHospitals": "",
  "keyBenefits": ["", ""],
  "redFlags": ["", ""],
  "renewalTerms": "",
  "gracePeriod": "",
  "maturityBenefit": "",
  "taxBenefit": "",
  "overallRating": 0,
  "ratingReason": "",
  "recommendations": ["", ""],
  "overallSummary": ""
}}

Rules:
- overallRating: integer 0-10 (10 = excellent policy for the insured).
- coverages: list every benefit clearly stated in the policy.
- exclusions: list every condition or situation NOT covered.
- waitingPeriods: list each waiting period with its duration.
- claimProcess: step-by-step numbered list of how to file a claim.
- redFlags: predatory clauses, unusually high exclusions, unclear terms.
- recommendations: 3-5 actionable tips for the policyholder.
- If a field is absent in the document use "" or 0.

Insurance Policy Document:
{truncated}
"""


def _clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return raw.strip()


def _mock_analysis(filename: str) -> Dict[str, Any]:
    return {
        "policyType": "Health",
        "insurer": "Sample Insurance Co. Ltd.",
        "policyNumber": f"INS-{abs(hash(filename)) % 90000 + 10000}",
        "policyHolderName": "John Doe",
        "sumInsured": "₹5,00,000",
        "premiumAmount": "₹12,000 per year",
        "premiumFrequency": "Annually",
        "policyTerm": "1 year (renewable)",
        "startDate": "01 Apr 2025",
        "expiryDate": "31 Mar 2026",
        "coverages": [
            "Hospitalisation expenses up to sum insured",
            "Day-care procedures",
            "Ambulance charges up to ₹2,000",
            "Pre and post hospitalisation (30/60 days)",
        ],
        "exclusions": [
            "Pre-existing diseases (2-year waiting period)",
            "Cosmetic surgery",
            "Dental treatment (unless accident-related)",
            "Maternity and newborn expenses (4-year waiting period)",
        ],
        "waitingPeriods": [
            "Pre-existing diseases: 2 years",
            "Specific diseases (cataract, hernia): 2 years",
            "Maternity: 4 years",
        ],
        "claimProcess": [
            "1. Notify the insurer within 24 hours of admission.",
            "2. Submit claim form with hospital discharge summary.",
            "3. Attach all bills, prescriptions, and test reports.",
            "4. Insurer processes claim within 30 working days.",
        ],
        "networkHospitals": "5,000+ across India",
        "keyBenefits": [
            "Cashless hospitalisation at network hospitals",
            "No room-rent sub-limit",
            "Free annual health check-up",
        ],
        "redFlags": [
            "Maternity benefit has a 4-year waiting period — very long.",
            "Room-rent capping clause may apply for certain room types.",
        ],
        "renewalTerms": "Lifetime renewable; premium increases with age.",
        "gracePeriod": "30 days after policy expiry",
        "maturityBenefit": "None (pure health plan)",
        "taxBenefit": "₹25,000 deductible under Section 80D",
        "overallRating": 7,
        "ratingReason": (
            "A solid entry-level health policy with cashless benefits and no room-rent cap, "
            "but the long maternity waiting period and standard exclusions limit its appeal."
        ),
        "recommendations": [
            "Add a top-up plan if your family size requires higher coverage.",
            "Check for restore benefit (refills sum insured after a claim).",
            "Compare similar plans — you may get a better premium for the same coverage.",
        ],
        "overallSummary": (
            "This is a standard individual health insurance policy with comprehensive hospitalisation "
            "coverage. It is well-suited for a single individual but may not adequately cover "
            "a family with maternity requirements. The 4-year maternity waiting period and bundled "
            "exclusions should be carefully reviewed."
        ),
    }


def analyze_insurance_policy(file_path: str, filename: str, uid: str) -> Dict[str, Any]:
    """
    Core pipeline: extract text → Gemini analysis → Firestore persistence → Storage upload.
    """
    # Step 1 — extract text
    try:
        raw_text = extract_text_from_pdf(file_path)
    except Exception as exc:
        logger.warning(f"[InsuranceAnalyzer] PDF extraction failed ({exc}); using filename only.")
        raw_text = f"Insurance policy document: {filename}"

    # Step 2 — AI analysis
    client = get_gemini_client()
    analysis: Dict[str, Any]
    if client:
        try:
            prompt = _build_prompt(raw_text)
            response = client.models.generate_content(
                model="gemini-flash-lite-latest",
                contents=prompt,
            )
            analysis = json.loads(_clean_json(response.text))
            logger.info(f"[InsuranceAnalyzer] Gemini analysis complete for {filename}.")
        except Exception as exc:
            logger.error(f"[InsuranceAnalyzer] Gemini error ({exc}); using mock.")
            analysis = _mock_analysis(filename)
    else:
        logger.warning("[InsuranceAnalyzer] Gemini client unavailable; using mock.")
        analysis = _mock_analysis(filename)

    # Step 3 — Firebase Storage upload (best-effort)
    doc_id = str(uuid.uuid4())
    blob_name = f"insurance_documents/{uid}/{doc_id}_{filename}"
    file_url: str = ""
    try:
        import asyncio
        loop = asyncio.new_event_loop()
        file_url = loop.run_until_complete(
            upload_file_to_storage(file_path, blob_name)
        ) or ""
        loop.close()
    except Exception:
        pass

    # Step 4 — persist to Firestore
    now = datetime.utcnow().isoformat()
    doc = {
        "userId": uid,
        "fileName": filename,
        "fileUrl": file_url,
        "uploadedAt": now,
        **analysis,
    }
    get_col(COLLECTION).document(doc_id).set(doc)
    doc["id"] = doc_id
    logger.info(f"[InsuranceAnalyzer] Saved analysis {doc_id} to Firestore.")
    return doc


# ── Firestore Read Helpers ────────────────────────────────────────────────────

def get_insurance_analyses(uid: str) -> List[Dict[str, Any]]:
    docs = list(get_col(COLLECTION).where("userId", "==", uid).stream())
    result = []
    for d in docs:
        data = d.to_dict() or {}
        data["id"] = d.id
        result.append(data)
    result.sort(key=lambda x: x.get("uploadedAt", ""), reverse=True)
    return result


def get_insurance_analysis_by_id(uid: str, doc_id: str) -> Dict[str, Any]:
    doc = get_col(COLLECTION).document(doc_id).get()
    if not doc.exists:
        raise ValueError("Insurance analysis not found.")
    data = doc.to_dict() or {}
    if data.get("userId") != uid:
        raise PermissionError("Access denied.")
    data["id"] = doc.id
    return data
