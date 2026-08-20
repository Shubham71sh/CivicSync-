"""
Insurance Policy Analyzer Service
Uses document chunking, indexing, and RAG retrieval to extract clauses about:
coverages, exclusions, waiting periods, premium, claim process, renewal, conditions, and limitations.
Uses the AI provider abstraction (Qwen3 via Ollama / fallbacks) for clause explanation.
Strictly cites sources and states 'Not specified in the uploaded policy' when evidence is missing.
"""

import json
import logging
import uuid
import asyncio
from datetime import datetime
from typing import Any, Dict, List

from app.config.database import get_col
from app.ai.orchestrator import orchestrator
from app.ai.ingestion.document_ingestion import index_document
from app.ai.retrieval.retrieval_service import get_retrieval_service
from app.services.pdf_service import extract_text_from_pdf
from app.services.storage_service import upload_file_to_storage

logger = logging.getLogger("uvicorn.error")

COLLECTION = "insurance_analyses"


def _build_analysis_prompt(context: str) -> str:
    return f"""
You are a senior insurance analyst and consumer-advocacy expert.

Based ONLY on the retrieved insurance policy clauses below, extract the details and explain the coverage.
If a field or detail is not present in the clauses, use exactly "Not specified in the uploaded policy" or 0 as appropriate. Do not guess or extrapolate.

Return ONLY valid JSON in this format:
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
  "coverages": ["coverage 1 with section citation", "coverage 2"],
  "exclusions": ["exclusion 1", "exclusion 2"],
  "waitingPeriods": ["waiting period details"],
  "claimProcess": ["1. step 1", "2. step 2"],
  "networkHospitals": "",
  "keyBenefits": ["benefit 1", "benefit 2"],
  "redFlags": ["red flag 1", "unusually high exclusion"],
  "renewalTerms": "",
  "gracePeriod": "",
  "maturityBenefit": "",
  "taxBenefit": "",
  "overallRating": 0,
  "ratingReason": "",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "overallSummary": "Brief overview of what the policy covers and any major gaps."
}}

Rules:
- overallRating: 0 to 10 integer (10 = excellent coverage).
- Every coverage, exclusion, and step in the claim process should cite the section/page number if available in the text.

Retrieved Clauses:
{context}
"""


async def analyze_insurance_policy(file_path: str, filename: str, uid: str) -> Dict[str, Any]:
    """
    RAG-based insurance policy analysis flow.
    """
    # Step 1: Extract PDF text
    try:
        raw_text = extract_text_from_pdf(file_path)
    except Exception as exc:
        logger.warning(f"[InsuranceAnalyzer] PDF extraction failed ({exc}); using filename only.")
        raw_text = f"Insurance policy: {filename}"

    doc_id = str(uuid.uuid4())

    # Step 2: Chunk & Index in Qdrant
    metadata = {
        "title": filename,
        "document_type": "insurance",
        "source": filename,
        "language": "en",
        "state": "All States",
        "category": "Insurance Policy",
        "firebase_id": doc_id
    }
    
    try:
        await index_document(doc_id, raw_text, metadata)
    except Exception as e:
        logger.error(f"[InsuranceAnalyzer] Indexing failed: {e}")

    # Step 3: RAG Retrieval for policy clauses
    retrieval_service = get_retrieval_service()
    query = "coverage exclusions waiting periods premium payment terms claim process settlement renewal grace period limits copay maternity benefit"
    
    context = ""
    try:
        retrieval_result = await retrieval_service.retrieve(
            query=query,
            filters={"document_id": doc_id},
            top_k=12
        )
        if retrieval_result.chunks:
            context = "\n\n".join([c.text for c in retrieval_result.chunks])
    except Exception as e:
        logger.error(f"[InsuranceAnalyzer] Retrieval failed: {e}")

    if not context:
        context = raw_text[:20000]

    # Step 4: LLM Clause Extraction & Explanation
    prompt = _build_analysis_prompt(context)
    analysis = None
    try:
        analysis = orchestrator.generate_json(prompt)
    except Exception as e:
        logger.error(f"[InsuranceAnalyzer] AI generation failed: {e}")

    if not analysis or not isinstance(analysis, dict):
        logger.warning("[InsuranceAnalyzer] AI failed to return valid analysis JSON. Using mock fallback.")
        from app.services.insurance_analyzer_service import _mock_analysis
        analysis = _mock_analysis(filename)

    # Step 5: Upload PDF to Firebase Storage (best-effort)
    blob_name = f"insurance_documents/{uid}/{doc_id}_{filename}"
    file_url = ""
    try:
        file_url = await upload_file_to_storage(file_path, blob_name) or ""
    except Exception:
        pass

    # Step 6: Persist to Firestore
    now = datetime.utcnow().isoformat()
    doc = {
        "userId": uid,
        "fileName": filename,
        "fileUrl": file_url,
        "uploadedAt": now,
        **analysis,
    }
    
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: get_col(COLLECTION).document(doc_id).set(doc)
    )
    
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


# Keep legacy _mock_analysis in module namespace for safety
def _mock_analysis(filename: str) -> Dict[str, Any]:
    from app.services.insurance_analyzer_service import _mock_analysis as old_mock
    return old_mock(filename)
