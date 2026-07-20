"""
Disaster Relief Reports Router — Firestore-backed.
Replaces the old SQLAlchemy/SQLite implementation completely.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4
from datetime import datetime

from app.schemas.report import ReportCreate
from app.config.database import get_col
from app.services.ai_service import analyze_disaster
from app.services.eligibility_service import check_eligibility
import asyncio

router = APIRouter(prefix="/reports", tags=["Reports"])


# ── Helper ────────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.utcnow().isoformat()


async def _get_report(report_id: str) -> dict:
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(
        None, lambda: get_col("reports").document(report_id).get()
    )
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Report not found")
    data = doc.to_dict()
    data["report_id"] = report_id
    return data


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/")
async def create_report(report: ReportCreate):
    report_id = f"REP-{str(uuid4())[:8]}"
    loop = asyncio.get_event_loop()

    report_data = {
        "report_id": report_id,
        "disaster_type": report.disaster_type,
        "location": report.location,
        "description": report.description,
        "status": "submitted",
        "created_at": _now(),
        "updated_at": _now(),
    }

    await loop.run_in_executor(
        None, lambda: get_col("reports").document(report_id).set(report_data)
    )

    return {
        "success": True,
        "report_id": report_id,
        "message": "Report saved successfully",
        "data": report_data,
    }


@router.post("/{report_id}/upload")
async def upload_images(report_id: str, files: list[UploadFile] = File(...)):
    # Verify report exists
    await _get_report(report_id)

    uploaded_files = []
    loop = asyncio.get_event_loop()

    for file in files:
        # Store file metadata in Firestore (actual binary stored to Firebase Storage ideally)
        img_id = str(uuid4())[:8]
        img_data = {
            "report_id": report_id,
            "file_name": file.filename,
            "image_id": img_id,
            "uploaded_at": _now(),
        }
        await loop.run_in_executor(
            None,
            lambda d=img_data, iid=img_id: get_col("report_images").document(iid).set(d),
        )
        uploaded_files.append(file.filename)

    return {
        "success": True,
        "report_id": report_id,
        "uploaded_files": uploaded_files,
    }


@router.post("/{report_id}/analyze")
async def analyze_report(report_id: str):
    report = await _get_report(report_id)
    loop = asyncio.get_event_loop()

    ai_result = analyze_disaster(report["disaster_type"])

    analysis_data = {
        "report_id": report_id,
        "damage_percent": ai_result["damage_percent"],
        "severity": ai_result["severity"],
        "house_damage": ai_result["house_damage"],
        "crop_damage": ai_result["crop_damage"],
        "vehicle_damage": ai_result["vehicle_damage"],
        "estimated_loss": ai_result["estimated_loss"],
        "ai_confidence": ai_result["ai_confidence"],
        "analyzed_at": _now(),
    }

    await loop.run_in_executor(
        None,
        lambda: get_col("report_analyses").document(report_id).set(analysis_data),
    )

    return {
        "success": True,
        "report_id": report_id,
        "analysis": analysis_data,
    }


@router.post("/{report_id}/eligibility")
async def eligibility_checker(report_id: str):
    loop = asyncio.get_event_loop()

    # Get analysis from Firestore
    doc = await loop.run_in_executor(
        None, lambda: get_col("report_analyses").document(report_id).get()
    )
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Analysis not found — run /analyze first")

    analysis = doc.to_dict()
    result = check_eligibility(analysis["damage_percent"])

    eligibility_data = {
        "report_id": report_id,
        "is_eligible": result["is_eligible"],
        "scheme_name": result["scheme_name"],
        "reason": result["reason"],
        "checked_at": _now(),
    }

    await loop.run_in_executor(
        None,
        lambda: get_col("report_eligibility").document(report_id).set(eligibility_data),
    )

    return {
        "success": True,
        "eligibility": eligibility_data,
    }


@router.get("/")
async def get_all_reports():
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(get_col("reports").stream()))
    reports = []
    for doc in docs:
        data = doc.to_dict()
        data["report_id"] = doc.id
        reports.append(data)

    return {
        "success": True,
        "count": len(reports),
        "data": reports,
    }


@router.get("/{report_id}")
async def get_report(report_id: str):
    report = await _get_report(report_id)
    return report


@router.post("/{report_id}/documents")
async def save_documents(report_id: str):
    await _get_report(report_id)
    loop = asyncio.get_event_loop()

    docs = [
        {"name": "Aadhaar Card", "status": "Verified", "size": "2.1 MB"},
        {"name": "House Damage Photos", "status": "Verified", "size": "5.4 MB"},
        {"name": "Bank Passbook", "status": "Pending", "size": ""},
    ]

    for d in docs:
        doc_id = str(uuid4())[:8]
        doc_data = {"report_id": report_id, **d, "uploaded_at": _now()}
        await loop.run_in_executor(
            None,
            lambda dd=doc_data, did=doc_id: get_col("report_documents").document(did).set(dd),
        )

    return {"success": True, "documents": docs}


@router.get("/{report_id}/documents")
async def get_documents(report_id: str):
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(
        None,
        lambda: list(
            get_col("report_documents").where("report_id", "==", report_id).stream()
        ),
    )
    documents = [
        {"name": d.to_dict().get("name"), "status": d.to_dict().get("status"), "size": d.to_dict().get("size")}
        for d in docs
    ]
    return {"success": True, "documents": documents}


@router.post("/{report_id}/timeline")
async def save_timeline(report_id: str):
    await _get_report(report_id)
    loop = asyncio.get_event_loop()

    timeline_data = [
        {"title": "Application Submitted", "description": "Your relief application has been submitted.", "status": "Completed"},
        {"title": "AI Damage Assessment", "description": "AI analyzed uploaded evidence.", "status": "Completed"},
        {"title": "Officer Verification", "description": "Pending government verification.", "status": "Pending"},
        {"title": "Relief Approved", "description": "Funds will be transferred.", "status": "Pending"},
    ]

    for item in timeline_data:
        tl_id = str(uuid4())[:8]
        tl_data = {"report_id": report_id, **item, "created_at": _now()}
        await loop.run_in_executor(
            None,
            lambda d=tl_data, tid=tl_id: get_col("report_timeline").document(tid).set(d),
        )

    return {"success": True, "timeline": timeline_data}


@router.get("/{report_id}/timeline")
async def get_timeline(report_id: str):
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(
        None,
        lambda: list(
            get_col("report_timeline").where("report_id", "==", report_id).stream()
        ),
    )
    timeline = [
        {
            "title": d.to_dict().get("title"),
            "description": d.to_dict().get("description"),
            "status": d.to_dict().get("status"),
        }
        for d in docs
    ]
    return {"success": True, "timeline": timeline}


@router.post("/{report_id}/nearby-help")
async def save_nearby_help(report_id: str):
    await _get_report(report_id)
    loop = asyncio.get_event_loop()

    nearby_data = [
        {"name": "District Disaster Relief Office", "type": "Government", "distance": "2.3 km", "contact": "1800-123-456"},
        {"name": "Red Cross Relief Camp", "type": "NGO", "distance": "4.1 km", "contact": "1800-789-012"},
        {"name": "Primary Health Centre", "type": "Medical", "distance": "1.5 km", "contact": "1800-345-678"},
    ]

    for item in nearby_data:
        nh_id = str(uuid4())[:8]
        nh_data = {"report_id": report_id, **item, "saved_at": _now()}
        await loop.run_in_executor(
            None,
            lambda d=nh_data, nid=nh_id: get_col("report_nearby_help").document(nid).set(d),
        )

    return {"success": True, "nearby_help": nearby_data}


@router.get("/{report_id}/nearby-help")
async def get_nearby_help(report_id: str):
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(
        None,
        lambda: list(
            get_col("report_nearby_help").where("report_id", "==", report_id).stream()
        ),
    )
    nearby_help = [
        {
            "name": d.to_dict().get("name"),
            "type": d.to_dict().get("type"),
            "distance": d.to_dict().get("distance"),
            "contact": d.to_dict().get("contact"),
        }
        for d in docs
    ]
    return {"success": True, "nearby_help": nearby_help}