from fastapi import APIRouter, UploadFile, File, Query, Depends
from app.schemas.bill_schema import (
    BillUploadResponse,
    BillListResponse,
    BillDetailResponse,
    BillDeleteResponse
)
from app.api.controllers.bill_controller import BillController
from app.middleware.auth import get_current_user
from typing import Dict, Any, Optional

router = APIRouter(
    prefix="/bills",
    tags=["Bills"]
)

@router.post("/upload", response_model=BillUploadResponse)
async def upload_bill(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload a government bill PDF to extract text and analyze impact using Gemini AI.
    """
    return await BillController.upload_bill_flow(file, current_user)

@router.get("", response_model=BillListResponse)
async def get_bills(
    search: Optional[str] = Query(None, description="Search bills by title or bill number"),
    status: Optional[str] = Query(None, description="Filter bills by status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieve paginated lists of uploaded bills with search and status filters.
    """
    return await BillController.get_bills_flow(
        search=search,
        status_filter=status,
        page=page,
        limit=limit,
        current_user=current_user
    )

@router.get("/{id}", response_model=BillDetailResponse)
async def get_bill_by_id(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Fetch the complete details, extracted text, and AI analysis for a specific bill.
    """
    return await BillController.get_bill_by_id_flow(id)

@router.delete("/{id}", response_model=BillDeleteResponse)
async def delete_bill(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a bill from history and clean up its stored document on disk.
    """
    return await BillController.delete_bill_flow(id)
