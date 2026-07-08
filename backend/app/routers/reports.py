from fastapi import APIRouter
from fastapi import UploadFile, File
from uuid import uuid4

import os
import shutil

from app.schemas.report import ReportCreate

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.post("/")
def create_report(report: ReportCreate):

    report_id = f"REP-{str(uuid4())[:8]}"

    return {
        "success": True,
        "report_id": report_id,
        "message": "Report created successfully",
        "data": report.model_dump()
    }

@router.post("/{report_id}/upload")
def upload_images(
    report_id: str,
    files: list[UploadFile] = File(...)
):

    upload_dir = "uploads"

    os.makedirs(upload_dir, exist_ok=True)

    uploaded_files = []

    for file in files:

        file_path = os.path.join(upload_dir, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        uploaded_files.append(file.filename)

    return {
        "success": True,
        "report_id": report_id,
        "uploaded_files": uploaded_files
    }

@router.post("/{report_id}/analyze")
def analyze_report(report_id: str):

    return {
        "success": True,
        "report_id": report_id,
        "analysis": {
            "damage_percent": 82,
            "severity": "High",
            "house_damage": 90,
            "crop_damage": 75,
            "vehicle_damage": 20,
            "ai_confidence": 94,
            "estimated_loss": 450000
        }
    }