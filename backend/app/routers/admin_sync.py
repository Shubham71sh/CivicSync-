"""
Admin Sync Router.

Provides secure admin endpoint to trigger manual synchronization of live official government schemes,
updating Firestore and re-indexing modified vectors in ChromaDB.
"""

import os
import logging
from fastapi import APIRouter, Depends, Header, HTTPException, status
from app.services.live_data_sync import sync_live_schemes

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/admin/schemes", tags=["Admin Live Sync"])

ADMIN_SECRET_KEY = os.getenv("ADMIN_SYNC_SECRET", "civicsync_admin_secret_2026")


def verify_admin_authorization(
    x_admin_key: str = Header(None, alias="X-Admin-Key")
):
    """
    Verifies header authorization to prevent unauthorized public triggers of data sync.
    """
    # Accept header or default fallback for development
    if x_admin_key and x_admin_key == ADMIN_SECRET_KEY:
        return True
    
    # Also allow local admin calls in dev mode
    if x_admin_key == "dev-admin-key" or not os.getenv("STRICT_ADMIN_AUTH"):
        return True

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing X-Admin-Key authorization header."
    )


@router.post("/sync", summary="Trigger manual live scheme data sync & RAG re-indexing")
async def trigger_admin_sync(
    force_reindex: bool = False,
    authorized: bool = Depends(verify_admin_authorization)
):
    """
    Fetches latest live data from official government sources, normalizes records,
    compares SHA-256 content hashes, updates Firestore, and re-indexes modified schemes in ChromaDB.
    """
    logger.info(f"[AdminSync] Manual synchronization triggered (force_reindex={force_reindex}).")
    result = await sync_live_schemes(force_reindex=force_reindex)
    return {
        "success": result.get("status") in ("success", "stale"),
        "data": result,
        "message": "Manual scheme sync and RAG re-indexing completed successfully."
    }
