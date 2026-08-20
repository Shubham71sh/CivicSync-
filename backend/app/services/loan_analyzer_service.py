"""
Loan Analyzer Service
Uses document chunking, indexing, and RAG retrieval to extract clauses about:
interest, processing fees, penalties, prepayment, collateral, default clauses, and insurance.
Uses the AI provider abstraction (Qwen3 via Ollama / fallbacks) for clause explanation.
Uses pure Python for all mathematical calculations (EMI, total payable, amortization schedule).
"""

import asyncio
import json
import logging
import uuid
import re
from datetime import datetime
from typing import Any, Dict, List

from app.config.database import get_col
from app.ai.orchestrator import orchestrator
from app.ai.ingestion.document_ingestion import index_document
from app.ai.retrieval.retrieval_service import get_retrieval_service
from app.services.pdf_service import extract_text_from_pdf
from app.services.storage_service import upload_file_to_storage

logger = logging.getLogger("uvicorn.error")

COLLECTION = "loan_analyses"


def _clean_number(text: str) -> float:
    """Extract float from a messy currency or rate string."""
    if not text:
        return 0.0
    # Find all digits, periods, commas
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(cleaned) if cleaned else 0.0
    except ValueError:
        return 0.0


def _calculate_financials(principal_str: str, rate_str: str, tenure: int) -> Dict[str, Any]:
    """
    Performs pure Python calculations for EMI, total payable, and amortization schedule.
    Guarantees mathematical correctness without depending on LLM logic.
    """
    principal = _clean_number(principal_str)
    rate = _clean_number(rate_str)
    
    if principal <= 0 or rate <= 0 or tenure <= 0:
        return {
            "principalAmount": f"₹{principal:,.2f}" if principal > 0 else principal_str,
            "interestRate": f"{rate}%" if rate > 0 else rate_str,
            "emiAmount": "Not specified / incomplete parameters",
            "totalPayable": "Not specified / incomplete parameters",
            "emiScheduleSample": []
        }

    # Monthly interest rate
    r = rate / 1200.0
    
    # EMI calculation
    try:
        emi = (principal * r * ((1 + r) ** tenure)) / (((1 + r) ** tenure) - 1)
        total_payable = emi * tenure
    except Exception:
        emi = 0.0
        total_payable = 0.0

    # Amortization schedule sample (first 3 months)
    schedule = []
    balance = principal
    for month in range(1, min(4, tenure + 1)):
        interest_payment = balance * r
        principal_payment = emi - interest_payment
        balance = max(0.0, balance - principal_payment)
        
        schedule.append({
            "month": month,
            "principal": f"₹{principal_payment:,.2f}",
            "interest": f"₹{interest_payment:,.2f}",
            "balance": f"₹{balance:,.2f}"
        })

    return {
        "principalAmount": f"₹{principal:,.2f}",
        "interestRate": f"{rate}% p.a.",
        "emiAmount": f"₹{emi:,.2f}",
        "totalPayable": f"₹{total_payable:,.2f}",
        "emiScheduleSample": schedule
    }


def _build_analysis_prompt(context: str) -> str:
    return f"""
You are a senior financial analyst and consumer-protection expert specialising in retail loan agreements.

Based ONLY on the retrieved loan agreement clauses below, extract the details and explain the clauses.
If information is missing, output empty string "" or 0 as appropriate. Do not invent details.

Return ONLY valid JSON in this format:
{{
  "loanType": "Personal|Home|Car|Business|Other",
  "lenderName": "",
  "borrowerName": "",
  "policyNumber": "Contract or reference number",
  "principalAmount": "stated principal amount text",
  "interestRate": "stated interest rate text (e.g. 10.5% floating)",
  "interestType": "Fixed|Floating|Hybrid",
  "tenureMonths": 0,
  "processingFee": "Processing fees or charges",
  "prepaymentPenalty": "Prepayment terms, penalties, or lock-in clauses",
  "latePenalty": "Late payment penalties",
  "hiddenCharges": ["charge 1", "charge 2"],
  "redFlags": ["predatory clause 1", "auto-renewal trap 1"],
  "keyTerms": ["important term 1", "important term 2"],
  "recommendations": ["actionable advice 1", "actionable advice 2"],
  "riskScore": 0,
  "riskLevel": "Low|Medium|High|Very High",
  "riskReason": "",
  "overallSummary": "Brief overview explaining key findings, hidden items, and risks."
}}

Rules:
- riskScore: 0-100 (100 is highest risk).
- Explain all terms neutrally and clearly. Do NOT guess or perform calculation.

Retrieved Clauses:
{context}
"""


async def analyze_loan_document(file_path: str, filename: str, uid: str) -> Dict[str, Any]:
    """
    RAG-based loan analysis flow.
    """
    # Step 1: Extract PDF text
    try:
        raw_text = extract_text_from_pdf(file_path)
    except Exception as exc:
        logger.warning(f"[LoanAnalyzer] PDF extraction failed ({exc}); using filename only.")
        raw_text = f"Loan document: {filename}"

    doc_id = str(uuid.uuid4())

    # Step 2: Chunk & Index in Qdrant
    metadata = {
        "title": filename,
        "document_type": "loan",
        "source": filename,
        "language": "en",
        "state": "All States",
        "category": "Loan Agreement",
        "firebase_id": doc_id
    }
    
    try:
        await index_document(doc_id, raw_text, metadata)
    except Exception as e:
        logger.error(f"[LoanAnalyzer] Indexing failed: {e}")

    # Step 3: RAG Retrieval for key clauses
    retrieval_service = get_retrieval_service()
    query = "interest rate processing fees penalties prepayment terms lock-in collateral security default clauses insurance requirements hidden charges red flags"
    
    context = ""
    try:
        retrieval_result = await retrieval_service.retrieve(
            query=query,
            filters={"document_id": doc_id},
            top_k=10
        )
        if retrieval_result.chunks:
            context = "\n\n".join([c.text for c in retrieval_result.chunks])
    except Exception as e:
        logger.error(f"[LoanAnalyzer] Retrieval failed: {e}")

    if not context:
        context = raw_text[:20000]

    # Step 4: LLM Clause Extraction & Explanation
    prompt = _build_analysis_prompt(context)
    analysis = None
    try:
        analysis = orchestrator.generate_json(prompt)
    except Exception as e:
        logger.error(f"[LoanAnalyzer] AI generation failed: {e}")

    if not analysis or not isinstance(analysis, dict):
        logger.warning("[LoanAnalyzer] AI failed to return valid analysis JSON. Using mock fallback.")
        from app.services.loan_analyzer_service import _mock_analysis
        analysis = _mock_analysis(filename)

    # Step 5: Pure Python mathematical calculations
    tenure = int(analysis.get("tenureMonths") or 0)
    principal_str = analysis.get("principalAmount") or "0"
    rate_str = analysis.get("interestRate") or "0"
    
    calculations = _calculate_financials(principal_str, rate_str, tenure)
    
    # Merge calculation results into analysis
    analysis.update(calculations)

    # Step 6: Upload PDF to Firebase Storage (best-effort)
    blob_name = f"loan_documents/{uid}/{doc_id}_{filename}"
    file_url = ""
    try:
        file_url = await upload_file_to_storage(file_path, blob_name) or ""
    except Exception:
        pass

    # Step 7: Persist to Firestore
    now = datetime.utcnow().isoformat()
    doc = {
        "userId": uid,
        "fileName": filename,
        "fileUrl": file_url,
        "uploadedAt": now,
        **analysis,
    }
    
    # Save synchronously in executor to avoid blocking loop
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: get_col(COLLECTION).document(doc_id).set(doc)
    )
    
    doc["id"] = doc_id
    logger.info(f"[LoanAnalyzer] Saved analysis {doc_id} to Firestore.")
    return doc


# ── Firestore Read Helpers ────────────────────────────────────────────────────

def get_loan_analyses(uid: str) -> List[Dict[str, Any]]:
    docs = list(get_col(COLLECTION).where("userId", "==", uid).stream())
    result = []
    for d in docs:
        data = d.to_dict() or {}
        data["id"] = d.id
        result.append(data)
    result.sort(key=lambda x: x.get("uploadedAt", ""), reverse=True)
    return result


def get_loan_analysis_by_id(uid: str, doc_id: str) -> Dict[str, Any]:
    doc = get_col(COLLECTION).document(doc_id).get()
    if not doc.exists:
        raise ValueError("Loan analysis not found.")
    data = doc.to_dict() or {}
    if data.get("userId") != uid:
        raise PermissionError("Access denied.")
    data["id"] = doc.id
    return data


# Keep legacy _mock_analysis in module namespace for safety
def _mock_analysis(filename: str) -> Dict[str, Any]:
    from app.services.loan_analyzer_service import _mock_analysis as old_mock
    return old_mock(filename)
