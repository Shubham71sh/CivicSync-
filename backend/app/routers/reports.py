"""
Disaster Relief Reports Router — Firestore-backed.
Replaces the old SQLAlchemy/SQLite implementation completely.

Merge notes:
- HEAD contributed: richer nearby-help data (5 services with phone/time/capacity),
  dynamic date-based timeline descriptions, image_paths passed to analyze_disaster.
- devasish-dev contributed: clean async Firestore implementation for all endpoints.
- Both contributions merged: Firestore storage + HEAD's richer data sets.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime, timedelta
import asyncio

from app.schemas.report import ReportCreate
from app.config.database import get_col
from app.services.ai_service import analyze_disaster
from app.services.eligibility_service import check_eligibility
from app.services.disaster_scheme_service import get_disaster_schemes

router = APIRouter(prefix="/reports", tags=["Reports"])


# ── Helpers ───────────────────────────────────────────────────────────────────

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
    await _get_report(report_id)

    uploaded_files = []
    loop = asyncio.get_event_loop()

    for file in files:
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

    # Fetch uploaded image metadata from Firestore (HEAD contribution: pass image paths)
    img_docs = await loop.run_in_executor(
        None,
        lambda: list(get_col("report_images").where("report_id", "==", report_id).stream()),
    )
    image_paths = [d.to_dict().get("file_name", "") for d in img_docs]

    ai_result = analyze_disaster(report["disaster_type"], image_paths)

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

    doc = await loop.run_in_executor(
        None, lambda: get_col("report_analyses").document(report_id).get()
    )
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Analysis not found — run /analyze first")

    analysis = doc.to_dict()
    result = check_eligibility(analysis["damage_percent"])

    eligibility_data = {
    "report_id": report_id,
    **result,
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


@router.get("/schemes")
async def get_schemes(
    disaster: str,
    damage: int,
    state: str = ""
):
    schemes = await get_disaster_schemes(
        disaster,
        damage,
        state
    )

    return {
        "success": True,
        "recommended": schemes
    }

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
        {
            "name": d.to_dict().get("name"),
            "status": d.to_dict().get("status"),
            "size": d.to_dict().get("size"),
        }
        for d in docs
    ]
    return {"success": True, "documents": documents}


@router.post("/{report_id}/timeline")
async def save_timeline(report_id: str):
    await _get_report(report_id)
    loop = asyncio.get_event_loop()

    # HEAD contribution: dynamic date-based descriptions
    today = datetime.now()
    timeline_data = [
        {
            "title": "Application Submitted",
            "description": f"Application submitted on {today.strftime('%d %b %Y')}",
            "status": "Completed",
        },
        {
            "title": "AI Damage Assessment",
            "description": f"AI analysis completed on {today.strftime('%d %b %Y')}",
            "status": "Completed",
        },
        {
            "title": "Officer Verification",
            "description": f"Verification scheduled on {(today + timedelta(days=1)).strftime('%d %b %Y')}",
            "status": "Pending",
        },
        {
            "title": "Relief Approved",
            "description": f"Expected approval on {(today + timedelta(days=3)).strftime('%d %b %Y')}",
            "status": "Pending",
        },
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

    # HEAD contribution: richer 5-service dataset with phone/time/capacity fields
    services = [
        {
            "name": "Civil Hospital",
            "type": "Hospital",
            "phone": "108",
            "distance": "1.3 km",
            "time": "5 min",
            "capacity": "Open",
        },
        {
            "name": "Disaster Relief Camp",
            "type": "Relief Camp",
            "phone": "1070",
            "distance": "850 m",
            "time": "2 min",
            "capacity": "250 People",
        },
        {
            "name": "Police Station",
            "type": "Police Station",
            "phone": "100",
            "distance": "2.4 km",
            "time": "7 min",
            "capacity": "24x7",
        },
        {
            "name": "Food Distribution Center",
            "type": "Food Center",
            "phone": "1800-500-222",
            "distance": "1.8 km",
            "time": "6 min",
            "capacity": "Meals Available",
        },
        {
            "name": "Electricity Office",
            "type": "Electricity Office",
            "phone": "1912",
            "distance": "3.2 km",
            "time": "9 min",
            "capacity": "Emergency Support",
        },
    ]

    for i, s in enumerate(services):
        nh_id = str(uuid4())[:8]
        nh_data = {"report_id": report_id, **s, "saved_at": _now()}
        await loop.run_in_executor(
            None,
            lambda d=nh_data, nid=nh_id: get_col("report_nearby_help").document(nid).set(d),
        )

    return {"success": True, "services": services}


@router.get("/{report_id}/nearby-help")
async def get_nearby_help(report_id: str):
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(
        None,
        lambda: list(
            get_col("report_nearby_help").where("report_id", "==", report_id).stream()
        ),
    )
    services = [
        {
            "id": i + 1,
            "name": d.to_dict().get("name"),
            "type": d.to_dict().get("type"),
            "phone": d.to_dict().get("phone"),
            "distance": d.to_dict().get("distance"),
            "time": d.to_dict().get("time"),
            "capacity": d.to_dict().get("capacity"),
        }
        for i, d in enumerate(docs)
    ]
    return {"success": True, "services": services}


import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("uvicorn.error")


def _send_confirmation_email(
    to_email: str,
    user_name: str,
    report_id: str,
    disaster_type: str,
    submission_date: str,
    submission_time: str,
    officer_name: str,
    scheme_name: str,
) -> tuple[bool, str]:
    if not to_email:
        return False, "No email address provided"

    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")

    email_body = (
        f"Hello {user_name or 'Citizen'},\n\n"
        f"Your Disaster Relief Application has been submitted successfully.\n\n"
        f"Application Details\n\n"
        f"• Report ID: {report_id}\n"
        f"• Disaster Type: {disaster_type}\n"
        f"• Submission Date: {submission_date}\n"
        f"• Submission Time: {submission_time}\n"
        f"• Status: Submitted Successfully\n"
        f"• Assigned Officer: {officer_name}\n"
        f"• Relief Scheme: {scheme_name}\n\n"
        f"Our team has received your application and it is now under review.\n\n"
        f"You can return to CivicSync anytime to:\n\n"
        f"• Track your application\n"
        f"• View claim progress\n"
        f"• Download your report\n"
        f"• Check inspection details\n\n"
        f"Thank you for using CivicSync.\n\n"
        f"Regards,\n"
        f"CivicSync Disaster Relief System"
    )

    if not smtp_host or not smtp_user:
        logger.info(
            f"[Email Notification Log] To: {to_email} | Subject: CivicSync — Disaster Relief Application Submitted Successfully"
        )
        logger.info(email_body)
        test_mode = os.getenv("EMAIL_TEST_MODE", "true").lower() == "true"
        if test_mode:
            return True, f"Confirmation email generated for {to_email} (Test Mode)"
        return False, "SMTP email server credentials not configured on backend"

    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_user
        msg["To"] = to_email
        msg["Subject"] = "CivicSync — Disaster Relief Application Submitted Successfully"
        msg.attach(MIMEText(email_body, "plain"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True, f"Confirmation email successfully delivered to {to_email}"
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {to_email}: {e}")
        return False, str(e)


class ReportSubmitPayload(BaseModel):
    email: str = ""
    user_name: str = ""
    disaster_type: str = ""
    scheme_name: str = ""
    relief_amount: str = ""
    inspection_date: str = ""
    officer_name: str = ""
    submission_date: str = ""
    submission_time: str = ""


@router.post("/{report_id}/submit")
async def submit_report_endpoint(report_id: str, payload: ReportSubmitPayload):
    loop = asyncio.get_event_loop()

    email_sent, email_msg = await loop.run_in_executor(
        None,
        lambda: _send_confirmation_email(
            payload.email,
            payload.user_name,
            report_id,
            payload.disaster_type,
            payload.submission_date,
            payload.submission_time,
            payload.officer_name,
            payload.scheme_name,
        ),
    )

    submission_data = {
        "status": "submitted_and_verified",
        "submitted_at": _now(),
        "user_email": payload.email,
        "user_name": payload.user_name,
        "disaster_type": payload.disaster_type,
        "scheme_name": payload.scheme_name,
        "relief_amount": payload.relief_amount,
        "inspection_date": payload.inspection_date,
        "officer_name": payload.officer_name,
        "submission_date": payload.submission_date,
        "submission_time": payload.submission_time,
        "email_status": "sent" if email_sent else "failed",
        "email_message": email_msg,
    }

    try:
        await loop.run_in_executor(
            None,
            lambda: get_col("reports").document(report_id).set(submission_data, merge=True),
        )
    except Exception as e:
        print(f"Could not save submission to Firestore: {e}")

    return {
        "success": True,
        "email_sent": email_sent,
        "report_id": report_id,
        "message": (
            "✅ Application Submitted Successfully\n\nA confirmation email has been sent to your registered email address."
            if email_sent
            else "Application submitted successfully, but the confirmation email could not be sent."
        ),
        "email_sent_to": payload.email,
        "email_error": None if email_sent else email_msg,
        "data": submission_data,
    }




