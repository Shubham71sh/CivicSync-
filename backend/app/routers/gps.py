from fastapi import APIRouter, Depends
from app.schemas.gps import DocumentUploadRequest, DocumentUpdateRequest
from app.services import gps_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/gps", tags=["GPS"])


@router.get("/dashboard")
async def gps_dashboard(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_dashboard(current_user["uid"])
    return {"success": True, **result}


@router.get("/roadmap")
async def gps_roadmap(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_roadmap(current_user["uid"])
    return {"success": True, **result}


@router.post("/generate-roadmap")
async def gps_generate_roadmap(current_user: dict = Depends(get_current_user)):
    result = await gps_service.generate_roadmap(current_user["uid"])
    return {"success": True, **result}


@router.get("/tasks")
async def gps_tasks(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_tasks(current_user["uid"])
    return {"success": True, **result}


@router.get("/documents")
async def gps_documents(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_documents(current_user["uid"])
    return {"success": True, **result}


@router.post("/documents/upload")
async def gps_upload_document(
    body: DocumentUploadRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await gps_service.upload_gps_document(
        current_user["uid"],
        body.name, body.fileName, body.fileSize or 0,
        body.fileData, body.expiryDate,
    )
    return {"success": True, **result}


@router.put("/documents/{doc_id}")
async def gps_update_document(
    doc_id: str,
    body: DocumentUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await gps_service.update_gps_document(
        current_user["uid"], doc_id, body.status, body.verificationNote
    )
    return {"success": True, **result}


@router.delete("/documents/{doc_id}")
async def gps_delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = await gps_service.delete_gps_document(current_user["uid"], doc_id)
    return {"success": True, **result}


@router.get("/schemes")
async def gps_schemes(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_schemes(current_user["uid"])
    return {"success": True, **result}


@router.get("/recommendations")
async def gps_recommendations(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_recommendations(current_user["uid"])
    return {"success": True, **result}


@router.get("/deadlines")
async def gps_deadlines(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_deadlines(current_user["uid"])
    return {"success": True, **result}


@router.get("/calendar")
async def gps_calendar(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_calendar(current_user["uid"])
    return {"success": True, **result}


@router.get("/application-progress")
async def gps_application_progress(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_application_progress(current_user["uid"])
    return {"success": True, **result}


@router.get("/notifications")
async def gps_notifications(current_user: dict = Depends(get_current_user)):
    result = await gps_service.get_gps_notifications(current_user["uid"])
    return {"success": True, **result}
