"""
Loan Analyzer Service
Extracts text from uploaded loan documents (PDF/DOCX) and uses the Gemini AI
to produce a structured financial analysis including risk score, hidden charges,
EMI breakdown, red flags, and personalised recommendations.
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

# ── Firestore collection name ─────────────────────────────────────────────────
COLLECTION = "loan_analyses"


# ── Gemini Analysis ───────────────────────────────────────────────────────────

def _build_prompt(text: str, filename: str) -> str:
    truncated = text[:30_000]
    return f"""
You are a senior financial analyst and consumer-protection expert specialising in retail loan agreements.

Carefully analyse the following loan document and return ONLY valid JSON (no markdown, no code fences).

Required JSON structure:
{{
  "loanType": "",
  "lenderName": "",
  "borrowerName": "",
  "policyNumber": "",
  "principalAmount": "",
  "interestRate": "",
  "interestType": "Fixed|Floating|Hybrid",
  "tenureMonths": 0,
  "emiAmount": "",
  "totalPayable": "",
  "processingFee": "",
  "prepaymentPenalty": "",
  "latePenalty": "",
  "hiddenCharges": ["", ""],
  "redFlags": ["", ""],
  "keyTerms": ["", ""],
  "recommendations": ["", ""],
  "riskScore": 0,
  "riskLevel": "Low|Medium|High|Very High",
  "riskReason": "",
  "emiScheduleSample": [
    {{"month": 1, "principal": "", "interest": "", "balance": ""}}
  ],
  "overallSummary": ""
}}

Rules:
- riskScore must be an integer 0-100 (100 = highest risk for borrower).
- hiddenCharges: list every charge not clearly stated in the headline terms.
- redFlags: identify any predatory clauses, auto-renewal traps, or unusual penalties.
- recommendations: 3-5 actionable tips for the borrower.
- emiScheduleSample: first 3 months only.
- If a field is not present in the document, use "" or 0 as appropriate.

Loan Document Text:
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
        "loanType": "Personal Loan",
        "lenderName": "Sample Bank Ltd.",
        "borrowerName": "John Doe",
        "policyNumber": f"LN-{abs(hash(filename)) % 90000 + 10000}",
        "principalAmount": "₹5,00,000",
        "interestRate": "12.5% p.a.",
        "interestType": "Fixed",
        "tenureMonths": 60,
        "emiAmount": "₹11,244",
        "totalPayable": "₹6,74,640",
        "processingFee": "₹5,000 (1%)",
        "prepaymentPenalty": "2% of outstanding principal",
        "latePenalty": "₹500 per month",
        "hiddenCharges": [
            "Documentation charges: ₹2,000",
            "Insurance premium (bundled): ₹3,500/year",
        ],
        "redFlags": [
            "Bundled insurance product — you may not need it.",
            "Prepayment lock-in of 12 months.",
        ],
        "keyTerms": [
            "Floating rate clause may increase EMI after 12 months.",
            "Guarantor required for loan amounts above ₹3 lakh.",
        ],
        "recommendations": [
            "Compare interest rates with at least 2 other lenders.",
            "Opt out of the bundled insurance if you have existing coverage.",
            "Negotiate the processing fee — banks often waive it.",
        ],
        "riskScore": 55,
        "riskLevel": "Medium",
        "riskReason": "Moderate interest rate with a prepayment penalty and bundled insurance inflate the effective cost.",
        "emiScheduleSample": [
            {"month": 1, "principal": "₹5,994", "interest": "₹5,208", "balance": "₹4,94,006"},
            {"month": 2, "principal": "₹6,056", "interest": "₹5,146", "balance": "₹4,87,950"},
            {"month": 3, "principal": "₹6,119", "interest": "₹5,082", "balance": "₹4,81,831"},
        ],
        "overallSummary": (
            "This is a standard retail personal loan with a moderate risk profile. "
            "The effective APR, when hidden charges are included, rises to approximately 14.2%. "
            "Borrowers should carefully evaluate the bundled insurance and prepayment terms "
            "before signing."
        ),
    }


def analyze_loan_document(file_path: str, filename: str, uid: str) -> Dict[str, Any]:
    """
    Core analysis pipeline:
      1. Extract text from PDF.
      2. Call Gemini (or return mock).
      3. Persist result to Firestore.
      4. Upload file to Firebase Storage.
    Returns the Firestore document dict.
    """
    # Step 1 — extract text
    try:
        raw_text = extract_text_from_pdf(file_path)
    except Exception as exc:
        logger.warning(f"[LoanAnalyzer] PDF extraction failed ({exc}); using filename only.")
        raw_text = f"Loan document: {filename}"

    # Step 2 — AI analysis
    client = get_gemini_client()
    analysis: Dict[str, Any]
    if client:
        try:
            prompt = _build_prompt(raw_text, filename)
            response = client.models.generate_content(
                model="gemini-flash-lite-latest",
                contents=prompt,
            )
            analysis = json.loads(_clean_json(response.text))
            logger.info(f"[LoanAnalyzer] Gemini analysis complete for {filename}.")
        except Exception as exc:
            logger.error(f"[LoanAnalyzer] Gemini error ({exc}); using mock.")
            analysis = _mock_analysis(filename)
    else:
        logger.warning("[LoanAnalyzer] Gemini client unavailable; using mock.")
        analysis = _mock_analysis(filename)

    # Step 3 — upload to Firebase Storage (best-effort)
    doc_id = str(uuid.uuid4())
    blob_name = f"loan_documents/{uid}/{doc_id}_{filename}"
    # We run storage upload fire-and-forget style — failure won't break the flow
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
    logger.info(f"[LoanAnalyzer] Saved analysis {doc_id} to Firestore.")
    return doc


# ── Firestore Read Helpers ────────────────────────────────────────────────────

def get_loan_analyses(uid: str) -> List[Dict[str, Any]]:
    """Return all loan analyses for the given user, newest first."""
    docs = list(
        get_col(COLLECTION).where("userId", "==", uid).stream()
    )
    result = []
    for d in docs:
        data = d.to_dict() or {}
        data["id"] = d.id
        result.append(data)
    result.sort(key=lambda x: x.get("uploadedAt", ""), reverse=True)
    return result


def get_loan_analysis_by_id(uid: str, doc_id: str) -> Dict[str, Any]:
    """Return a single analysis; raises ValueError if not found / not owned."""
    doc = get_col(COLLECTION).document(doc_id).get()
    if not doc.exists:
        raise ValueError("Loan analysis not found.")
    data = doc.to_dict() or {}
    if data.get("userId") != uid:
        raise PermissionError("Access denied.")
    data["id"] = doc.id
    return data
