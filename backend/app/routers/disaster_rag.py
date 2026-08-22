"""
Disaster Relief RAG Router — FAISS Vector Search + MiniLM Embeddings.

Endpoints:
  POST /disaster-rag/schemes     → Step 5 — Government Schemes RAG (FAISS + MiniLM)
  POST /disaster-rag/eligibility → Step 6 — Eligibility RAG for applied schemes
  POST /disaster-rag/documents   → Step 7 — Official Documents RAG for applied schemes
  POST /disaster-rag/timeline    → Step 8 — Claim Timeline RAG
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

from rag.rag_service import (
    get_schemes_rag_service,
    get_eligibility_rag_service,
    get_documents_rag_service,
    get_timeline_rag_service,
)

logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/disaster-rag",
    tags=["Disaster Relief RAG"],
)


class DisasterRAGRequest(BaseModel):
    disaster_type: str = Field(..., description="Disaster type (e.g. flood, fire, earthquake, landslide, cyclone, heavy_rain)")
    damage_percent: int = Field(default=50, ge=0, le=100, description="Damage percentage from AI analysis")
    severity: str = Field(default="Moderate", description="Damage severity level")
    location: Optional[str] = Field(default=None, description="User location / state")
    applied_schemes: Optional[List[Dict[str, Any]]] = Field(default=None, description="Applied schemes list")


@router.post("/schemes")
async def rag_schemes(body: DisasterRAGRequest):
    """Step 5 — Retrieve verified government relief schemes using FAISS vector search."""
    try:
        result = await get_schemes_rag_service(
            disaster_type=body.disaster_type,
            damage_percent=body.damage_percent,
            severity=body.severity,
            location=body.location,
        )
        return {"success": True, "rag": result}
    except Exception as exc:
        logger.error(f"[DisasterRAG /schemes] Error: {exc}", exc_info=True)
        return {
            "success": False,
            "rag": {
                "rag_available": False,
                "message": "FAISS RAG service is temporarily unavailable.",
                "sources": [],
            },
        }


@router.post("/eligibility")
async def rag_eligibility(body: DisasterRAGRequest):
    """Step 6 — Evaluate eligibility ONLY for applied schemes using FAISS retrieved context."""
    try:
        result = await get_eligibility_rag_service(
            disaster_type=body.disaster_type,
            damage_percent=body.damage_percent,
            severity=body.severity,
            applied_schemes=body.applied_schemes,
        )
        return {"success": True, "rag": result}
    except Exception as exc:
        logger.error(f"[DisasterRAG /eligibility] Error: {exc}", exc_info=True)
        return {
            "success": False,
            "rag": {
                "rag_available": False,
                "message": "FAISS RAG service is temporarily unavailable.",
                "sources": [],
            },
        }


@router.post("/documents")
async def rag_documents(body: DisasterRAGRequest):
    """Step 7 — Retrieve official document requirements using FAISS vector search."""
    try:
        result = await get_documents_rag_service(
            disaster_type=body.disaster_type,
            damage_percent=body.damage_percent,
            severity=body.severity,
            applied_schemes=body.applied_schemes,
        )
        return {"success": True, "rag": result}
    except Exception as exc:
        logger.error(f"[DisasterRAG /documents] Error: {exc}", exc_info=True)
        return {
            "success": False,
            "rag": {
                "rag_available": False,
                "message": "FAISS RAG service is temporarily unavailable.",
                "sources": [],
            },
        }


@router.post("/timeline")
async def rag_timeline(body: DisasterRAGRequest):
    """Step 8 — Retrieve official claim process and timeline using FAISS vector search."""
    try:
        result = await get_timeline_rag_service(
            disaster_type=body.disaster_type,
            damage_percent=body.damage_percent,
            severity=body.severity,
        )
        return {"success": True, "rag": result}
    except Exception as exc:
        logger.error(f"[DisasterRAG /timeline] Error: {exc}", exc_info=True)
        return {
            "success": False,
            "rag": {
                "rag_available": False,
                "message": "FAISS RAG service is temporarily unavailable.",
                "sources": [],
            },
        }
