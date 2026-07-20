from fastapi import APIRouter, Depends
from app.schemas.gps import DocumentUploadRequest
from app.services import gps_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", status_code=201)
async def upload_document(
    body: DocumentUploadRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await gps_service.upload_gps_document(
        current_user["uid"],
        body.name, body.fileName, body.fileSize or 0,
        body.fileData, body.expiryDate,
    )
    # The Node controller returns 201 status code (FastAPI does too)
    return {"success": True, "message": "Document uploaded successfully.", **result}


@router.get("/")
async def get_documents(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_documents(current_user["uid"])
    return {"success": True, **result}


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = await gps_service.delete_gps_document(current_user["uid"], doc_id)
    return {"success": True, **result}
