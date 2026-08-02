"""
Loan Analyzer Router — /api/loan-analyzer
"""

import os
import asyncio
import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.core.deps import get_current_user
from app.services import loan_analyzer_service as svc

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/loan-analyzer", tags=["Loan Analyzer"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "loans")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


# ── Upload & Analyze ──────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_loan_document(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Upload a loan document (PDF/DOCX) and receive an AI-powered analysis."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Allowed: PDF, DOC, DOCX, TXT.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds the 50 MB limit.")

    # Save to disk temporarily
    safe_name = f"{current_user['_id']}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        loop = asyncio.get_event_loop()
        doc = await loop.run_in_executor(
            None,
            svc.analyze_loan_document,
            file_path,
            file.filename,
            current_user["_id"],
        )
        return JSONResponse(status_code=200, content={"success": True, "analysis": doc})
    except Exception as exc:
        logger.error(f"[LoanAnalyzer] analyze failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


# ── List Analyses ─────────────────────────────────────────────────────────────

@router.get("/analyses")
async def list_analyses(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Return all loan analyses for the authenticated user."""
    try:
        loop = asyncio.get_event_loop()
        docs = await loop.run_in_executor(
            None, svc.get_loan_analyses, current_user["_id"]
        )
        return {"success": True, "analyses": docs, "total": len(docs)}
    except Exception as exc:
        logger.error(f"[LoanAnalyzer] list_analyses error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# ── Single Analysis ───────────────────────────────────────────────────────────

@router.get("/analyses/{doc_id}")
async def get_analysis(
    doc_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Return a single loan analysis by ID."""
    try:
        loop = asyncio.get_event_loop()
        doc = await loop.run_in_executor(
            None, svc.get_loan_analysis_by_id, current_user["_id"], doc_id
        )
        return {"success": True, "analysis": doc}
    except ValueError:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied.")
    except Exception as exc:
        logger.error(f"[LoanAnalyzer] get_analysis error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
