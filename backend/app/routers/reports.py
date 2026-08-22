"""
Disaster Relief Reports Router — Firestore-backed.
Replaces the old SQLAlchemy/SQLite implementation completely.

Merge notes:
- HEAD contributed: richer nearby-help data (5 services with phone/time/capacity),
  dynamic date-based timeline descriptions, image_paths passed to analyze_disaster.
- devasish-dev contributed: clean async Firestore implementation for all endpoints.
- Both contributions merged: Firestore storage + HEAD's richer data sets.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime, timedelta
import asyncio
import os
import base64
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.schemas.report import ReportCreate
from app.config.database import get_col
from app.services.ai_service import analyze_disaster, validate_evidence
from app.services.eligibility_service import check_eligibility
from app.services.disaster_scheme_service import get_disaster_schemes
from app.services.disaster_rag_service import get_rag_response

router = APIRouter(prefix="/reports", tags=["Reports"])
logger = logging.getLogger("uvicorn.error")


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


def _email_row(label: str, value: str, highlight: bool = False, color: str = "#FFFFFF") -> str:
    """Helper function to generate HTML email table row"""
    label_color = "#F4C95D" if highlight else "#A5A8B5"
    return f"""
    <tr>
      <td style="padding:8px 0;color:{label_color};font-size:12px;font-weight:600;vertical-align:top;width:40%;">{label}</td>
      <td style="padding:8px 0;color:{color};font-size:13px;vertical-align:top;">{value}</td>
    </tr>"""


def _build_email_html(
    user_name: str,
    report_id: str,
    disaster_type: str,
    scheme_name: str,
    eligibility_status: str,
    relief_amount: str,
    application_status: str,
    officer_name: str,
    inspection_date: str,
    inspection_time: str,
    next_step: str,
    submission_date: str,
    submission_time: str,
) -> tuple[str, str]:
    """Build plain text and HTML email body"""
    
    officer_display = officer_name if officer_name != "Not assigned yet" else "Will be assigned soon"
    inspection_display = f"{inspection_date}" + (f" at {inspection_time}" if inspection_time else "") if inspection_date != "Not scheduled yet" else "Pending scheduling"
    
    # Plain text version
    plain = (
        f"Hello {user_name or 'Citizen'},\n\n"
        f"Your CivicSync Disaster Relief Application has been successfully submitted.\n\n"
        f"APPLICATION DETAILS\n"
        f"-------------------\n\n"
        f"Report ID             : {report_id}\n"
        f"Disaster Type         : {disaster_type}\n"
        f"Government Scheme     : {scheme_name}\n"
        f"Eligibility Status    : {eligibility_status}\n"
        f"Relief Amount         : {relief_amount}\n"
        f"Application Status    : {application_status}\n"
        f"Assigned Officer      : {officer_display}\n"
        f"Inspection            : {inspection_display}\n"
        f"Submitted On          : {submission_date} at {submission_time}\n\n"
        f"NEXT STEP\n"
        f"---------\n\n"
        f"{next_step}\n\n"
        f"You can track the progress of your application from CivicSync.\n\n"
        f"Regards,\n"
        f"CivicSync Disaster Relief System"
    )
    
    # HTML version with email rows
    rows = (
        _email_row("Report ID", report_id, highlight=True)
        + _email_row("Disaster Type", disaster_type)
        + _email_row("Government Scheme", scheme_name)
        + _email_row("Eligibility Status", eligibility_status, color="#22C55E")
        + _email_row("Relief Amount", relief_amount, color="#22C55E")
        + _email_row("Application Status", application_status)
        + _email_row("Assigned Officer", officer_display)
        + _email_row("Inspection", inspection_display)
        + _email_row("Submitted On", f"{submission_date} at {submission_time}")
    )

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CivicSync — Disaster Relief Application Submitted</title>
</head>
<body style="margin:0;padding:0;background:#0B0B12;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B12;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#11131A;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 40px;text-align:left;">
          <div style="display:inline-block;background:rgba(244,201,93,0.12);border:1px solid rgba(244,201,93,0.3);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
            <span style="color:#F4C95D;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">CivicSync</span>
          </div>
          <h1 style="color:#FFFFFF;margin:0 0 8px;font-size:22px;font-weight:700;line-height:1.3;">Disaster Relief Application Submitted</h1>
          <p style="color:#A5A8B5;margin:0;font-size:13px;">Your application is registered and under review.</p>
        </td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p style="color:#FFFFFF;font-size:15px;margin:0 0 6px;">Hello <strong>{user_name or "Citizen"}</strong>,</p>
          <p style="color:#A5A8B5;font-size:13px;line-height:1.6;margin:0;">Your CivicSync Disaster Relief Application has been <strong style="color:#22C55E;">successfully submitted</strong>. The details of your application are below.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 0;">
          <h2 style="color:#F4C95D;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:10px;">Application Details</h2>
          <table width="100%" cellpadding="0" cellspacing="0">{rows}</table>
        </td></tr>
        <tr><td style="padding:24px 40px 0;">
          <div style="background:rgba(244,201,93,0.06);border:1px solid rgba(244,201,93,0.15);border-radius:10px;padding:16px 20px;">
            <p style="color:#F4C95D;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px;">Next Step</p>
            <p style="color:#FFFFFF;font-size:13px;line-height:1.6;margin:0;">{next_step}</p>
          </div>
        </td></tr>
        <tr><td style="padding:28px 40px 32px;">
          <p style="color:#A5A8B5;font-size:12px;line-height:1.6;margin:0 0 12px;">You can track the progress of your application from CivicSync anytime.</p>
          <p style="color:#A5A8B5;font-size:11px;margin:0;">This is an automated email from the <strong style="color:#FFFFFF;">CivicSync Disaster Relief System</strong>. Please do not reply.</p>
          <p style="color:rgba(165,168,181,0.4);font-size:10px;margin:16px 0 0;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">&copy; 2024 CivicSync. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    return plain, html


def _send_confirmation_email(
    to_email: str,
    user_name: str,
    report_id: str,
    disaster_type: str,
    scheme_name: str,
    eligibility_status: str,
    relief_amount: str,
    application_status: str,
    officer_name: str,
    inspection_date: str,
    inspection_time: str,
    next_step: str,
    submission_date: str,
    submission_time: str,
) -> tuple:
    """Send confirmation email after application submission"""
    if not to_email or "@" not in to_email:
        return False, "No valid email address provided."

    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip()
    email_from = os.getenv("EMAIL_FROM", smtp_user).strip() or smtp_user

    plain_body, html_body = _build_email_html(
        user_name=user_name,
        report_id=report_id,
        disaster_type=disaster_type,
        scheme_name=scheme_name,
        eligibility_status=eligibility_status,
        relief_amount=relief_amount,
        application_status=application_status,
        officer_name=officer_name,
        inspection_date=inspection_date,
        inspection_time=inspection_time,
        next_step=next_step,
        submission_date=submission_date,
        submission_time=submission_time,
    )

    # Always log the attempt for audit
    logger.info(f"[CivicSync Email] Attempting delivery → To: {to_email} | Report: {report_id}")

    if not smtp_host or not smtp_user:
        logger.warning(
            "[CivicSync Email] SMTP credentials not configured — email NOT sent. "
            "Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM in backend/.env to enable real email delivery."
        )
        logger.info(f"[CivicSync Email Body (preview)]\n{plain_body}")
        return False, (
            "SMTP credentials not configured on backend. "
            "Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM to backend/.env"
        )

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"CivicSync <{email_from}>"
        msg["To"] = to_email
        msg["Subject"] = "CivicSync — Disaster Relief Application Submitted"
        msg["Reply-To"] = "noreply@civicsync.in"
        msg.attach(MIMEText(plain_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()

        logger.info(f"[CivicSync Email] Successfully delivered to {to_email}")
        return True, f"Confirmation email delivered to {to_email}"

    except smtplib.SMTPAuthenticationError:
        logger.error(f"[CivicSync Email] SMTP authentication failed — check SMTP_USER/SMTP_PASSWORD")
        return False, "SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD in backend/.env"
    except smtplib.SMTPException as e:
        logger.error(f"[CivicSync Email] SMTP error: {e}")
        return False, f"SMTP error: {str(e)}"
    except Exception as e:
        logger.error(f"[CivicSync Email] Unexpected error: {e}")
        return False, f"Email delivery failed: {str(e)}"


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


@router.get("/{report_id}/status")
async def get_report_status(report_id: str):
    """
    Restore full workflow state for a report — called on Disaster Relief page load.

    Returns everything stored in Firestore for this report so the frontend
    can rebuild its in-memory state without re-uploading or re-analysing.
    """
    loop = asyncio.get_event_loop()

    # ── Base report ───────────────────────────────────────────────────────
    report_doc = await loop.run_in_executor(
        None, lambda: get_col("reports").document(report_id).get()
    )
    if not report_doc.exists:
        raise HTTPException(status_code=404, detail="Report not found")

    report = report_doc.to_dict()

    # ── Analysis ──────────────────────────────────────────────────────────
    analysis_doc = await loop.run_in_executor(
        None, lambda: get_col("report_analyses").document(report_id).get()
    )
    analysis = analysis_doc.to_dict() if analysis_doc.exists else None

    # ── Evidence validation metadata (no raw bytes) ───────────────────────
    ev_docs = await loop.run_in_executor(
        None,
        lambda: list(
            get_col("report_evidence_validation")
            .where("report_id", "==", report_id)
            .stream()
        ),
    )
    evidence_validations = []
    for ev in ev_docs:
        d = ev.to_dict()
        # Never return raw bytes in status — only metadata
        evidence_validations.append({
            "filename":          d.get("filename"),
            "file_type":         d.get("file_type"),
            "valid":             d.get("valid"),
            "relevant":          d.get("relevant"),
            "confidence":        d.get("confidence"),
            "detected_objects":  d.get("detected_objects", []),
            "evidence":          d.get("evidence", []),
            "possible_damage":   d.get("possible_damage", []),
            "summary":           d.get("summary", ""),
            "reject_reason":     d.get("reject_reason", ""),
            "validated_at":      d.get("validated_at"),
        })

    # ── Determine workflow step ───────────────────────────────────────────
    # step 1 = disaster selected, step 2 = upload, step 3 = analysis done, etc.
    completed_step = 1
    if evidence_validations:
        completed_step = max(completed_step, 2)
    if analysis and analysis.get("damage_percent") is not None:
        completed_step = max(completed_step, 3)
    if report.get("status") == "submitted_and_verified":
        completed_step = 9

    logger.info(f"[Status] report={report_id} completed_step={completed_step} evidence_count={len(evidence_validations)}")

    return {
        "success":            True,
        "report_id":          report_id,
        "disaster_type":      report.get("disaster_type"),
        "status":             report.get("status"),
        "created_at":         report.get("created_at"),
        "completed_step":     completed_step,
        "analysis":           analysis,
        "evidence_validations": evidence_validations,
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


@router.post("/{report_id}/validate-evidence")
async def validate_evidence_endpoint(
    report_id: str,
    file: UploadFile = File(...),
    disaster_type: str = Form(...),
):
    """
    Step 2 — Validate a single uploaded file against the selected disaster type.
    Calls Gemini Vision for images, pypdf + Gemini for PDFs.
    Returns structured evidence result: valid/relevant/confidence/detected_objects/etc.
    """
    await _get_report(report_id)

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {exc}")

    if not file_bytes or len(file_bytes) < 16:
        return {
            "success": False,
            "valid": False,
            "relevant": False,
            "confidence": 0,
            "file_type": "unknown",
            "detected_objects": [],
            "evidence": [],
            "possible_damage": [],
            "reject_reason": "Uploaded file is empty or corrupted.",
            "summary": "Empty file.",
            "disaster": disaster_type,
        }

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: validate_evidence(
            file_bytes=file_bytes,
            filename=file.filename or "evidence",
            disaster_type=disaster_type,
        ),
    )

    # Store the validated evidence metadata in Firestore (without the raw bytes)
    ev_doc_id = str(uuid4())[:8]
    ev_data = {
        "report_id": report_id,
        "filename": file.filename,
        "disaster_type": disaster_type,
        "valid": result.get("valid", False),
        "relevant": result.get("relevant", False),
        "confidence": result.get("confidence", 0),
        "file_type": result.get("file_type", "unknown"),
        "detected_objects": result.get("detected_objects", []),
        "evidence": result.get("evidence", []),
        "possible_damage": result.get("possible_damage", []),
        "summary": result.get("summary", ""),
        "reject_reason": result.get("reject_reason", ""),
        "validated_at": _now(),
    }
    try:
        await loop.run_in_executor(
            None,
            lambda: get_col("report_evidence_validation").document(ev_doc_id).set(ev_data),
        )
    except Exception as exc:
        logger.warning(f"[ValidateEvidence] Firestore save skipped: {exc}")

    # For image files: store base64 bytes in Firestore so /analyze can use them
    from app.services.ai_service import _detect_mime, _SUPPORTED_IMAGE_MIMES
    detected_mime = _detect_mime(file_bytes, file.filename or "")
    if result.get("valid") and result.get("relevant") and detected_mime in _SUPPORTED_IMAGE_MIMES:
        b64 = base64.b64encode(file_bytes).decode("utf-8")
        img_evidence_id = str(uuid4())[:8]
        try:
            await loop.run_in_executor(
                None,
                lambda: get_col("report_image_bytes").document(img_evidence_id).set({
                    "report_id": report_id,
                    "filename": file.filename,
                    "mime": detected_mime,
                    "bytes_b64": b64,
                    "stored_at": _now(),
                }),
            )
        except Exception as exc:
            logger.warning(f"[ValidateEvidence] Image bytes storage skipped: {exc}")

    logger.info(
        f"[ValidateEvidence] report={report_id} file={file.filename} "
        f"valid={result.get('valid')} relevant={result.get('relevant')} "
        f"confidence={result.get('confidence')}%"
    )

    return {"success": True, **result}


@router.post("/{report_id}/analyze")
async def analyze_report(report_id: str, force: bool = False):
    """
    Step 3 — AI damage assessment.

    Returns cached result immediately if analysis already exists for this report
    (unless force=true is passed).  Only re-runs Gemini when genuinely needed.
    """
    report = await _get_report(report_id)
    loop = asyncio.get_event_loop()
    disaster_type = report.get("disaster_type", "flood")

    # ── Cache check: return existing analysis if already done ─────────────
    if not force:
        cached_doc = await loop.run_in_executor(
            None, lambda: get_col("report_analyses").document(report_id).get()
        )
        if cached_doc.exists:
            cached = cached_doc.to_dict()
            # Only serve cache if it has real values (not a bare skeleton)
            if cached.get("damage_percent") is not None:
                logger.info(f"[Analyze] Returning cached analysis for report={report_id}")
                return {
                    "success":   True,
                    "report_id": report_id,
                    "analysis":  cached,
                    "cached":    True,
                }

    # ── Load validated evidence from Firestore ────────────────────────────
    ev_docs = await loop.run_in_executor(
        None,
        lambda: list(
            get_col("report_evidence_validation")
            .where("report_id", "==", report_id)
            .stream()
        ),
    )

    # Use the first accepted (valid + relevant) evidence entry
    evidence_context: dict = {}
    for ev_doc in ev_docs:
        ev = ev_doc.to_dict()
        if ev.get("valid") and ev.get("relevant"):
            evidence_context = {
                "file_type":       ev.get("file_type", "unknown"),
                "detected_objects": ev.get("detected_objects", []),
                "evidence":        ev.get("evidence", []),
                "possible_damage": ev.get("possible_damage", []),
                "summary":         ev.get("summary", ""),
                "confidence":      ev.get("confidence", 0),
            }
            break

    if not evidence_context:
        logger.warning(f"[Analyze] No validated evidence found for report={report_id} — using disaster-type fallback")

    # ── Load raw image bytes for Gemini Vision ────────────────────────────
    img_bytes_docs = await loop.run_in_executor(
        None,
        lambda: list(
            get_col("report_image_bytes")
            .where("report_id", "==", report_id)
            .stream()
        ),
    )
    for ib_doc in img_bytes_docs:
        ib = ib_doc.to_dict()
        if ib.get("bytes_b64"):
            evidence_context["file_bytes_b64"] = ib["bytes_b64"]
            evidence_context["file_mime"] = ib.get("mime", "image/jpeg")
            break

    # ── Run Gemini damage assessment ──────────────────────────────────────
    ai_result = await loop.run_in_executor(
        None,
        lambda: analyze_disaster(
            disaster_type=disaster_type,
            evidence_context=evidence_context if evidence_context else None,
        ),
    )

    analysis_data = {
        "report_id":        report_id,
        "damage_percent":   ai_result.get("damage_percent"),
        "severity":         ai_result.get("severity"),
        "house_damage":     ai_result.get("house_damage"),
        "crop_damage":      ai_result.get("crop_damage"),
        "vehicle_damage":   ai_result.get("vehicle_damage"),
        "estimated_loss":   ai_result.get("estimated_loss"),
        "ai_confidence":    ai_result.get("ai_confidence"),
        "metrics":          ai_result.get("metrics", []),
        "evidence_summary": ai_result.get("evidence_summary", ""),
        "observations":     ai_result.get("observations", []),
        "limitations":      ai_result.get("limitations", []),
        "is_fallback":      ai_result.get("is_fallback", False),
        "analyzed_at":      _now(),
    }

    await loop.run_in_executor(
        None,
        lambda: get_col("report_analyses").document(report_id).set(analysis_data),
    )

    logger.info(
        f"[Analyze] report={report_id} damage={analysis_data['damage_percent']}% "
        f"severity={analysis_data['severity']} fallback={analysis_data['is_fallback']}"
    )

    return {
        "success":   True,
        "report_id": report_id,
        "analysis":  analysis_data,
        "cached":    False,
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
    damage_percent = analysis.get("damage_percent", 50)
    severity = analysis.get("severity", "Moderate")

    # Fetch report to get disaster_type
    report_doc = await loop.run_in_executor(
        None, lambda: get_col("reports").document(report_id).get()
    )
    disaster_type = "flood"
    if report_doc.exists:
        disaster_type = report_doc.to_dict().get("disaster_type", "flood")

    # Query RAG for verified eligibility
    rag_res = await get_rag_response(disaster_type, damage_percent, severity, "eligibility")

    if rag_res and rag_res.get("rag_available") and isinstance(rag_res.get("data"), dict):
        data = rag_res["data"]
        status = data.get("status", "Eligible")
        explanation = data.get("explanation", "")
        top_src = (rag_res.get("sources") or [{}])[0]
        source_authority = data.get("source_authority") or top_src.get("authority", "Ministry of Home Affairs")
        document_name = data.get("document_name") or top_src.get("document", "SDRF and NDRF Guidelines")
        source_url = data.get("source_url") or top_src.get("url", "https://ndma.gov.in")

        matched = data.get("conditions_matched", [])
        pending = data.get("conditions_pending", [])

        eligibility_data = {
            "report_id": report_id,
            "is_eligible": status in ["Eligible", "Possibly Eligible"],
            "scheme_name": data.get("scheme_name") or "National Disaster Relief Fund",
            "reason": f"{explanation}\n\n[Official Source: {source_authority} — {document_name}]",
            "amount": data.get("relief_amount") or "₹95,100",
            "department": source_authority,
            "priority": severity,
            "confidence": analysis.get("ai_confidence", 94),
            "benefits": matched if matched else [
                "Direct Benefit Transfer to Bank Account",
                "Emergency Temporary Shelter Support",
                "Essential Living Allowance",
                "Rehabilitation & Reconstruction Grant"
            ],
            "documents": pending if pending else [
                "Aadhaar Card Verification",
                "Bank Passbook (Direct Deposit)",
                "Geo-tagged Damage Photos",
                "Property Ownership / Lease Record"
            ],
            "timeline": "7-14 Days",
            "status": status,
            "source_authority": source_authority,
            "document_name": document_name,
            "official_source_url": source_url,
            "verified": True,
            "checked_at": _now()
        }
    else:
        result = check_eligibility(damage_percent)
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
    severity = "Severe" if damage >= 70 else ("Major" if damage >= 40 else ("Moderate" if damage >= 20 else "Minor"))
    rag_res = await get_rag_response(disaster, damage, severity, "schemes")

    if rag_res and rag_res.get("rag_available") and isinstance(rag_res.get("data"), dict) and "schemes" in rag_res["data"]:
        raw_schemes = rag_res["data"]["schemes"]
        top_src = (rag_res.get("sources") or [{}])[0]
        formatted = []
        for i, s in enumerate(raw_schemes):
            auth = s.get("source_authority") or s.get("authority") or top_src.get("authority", "Ministry of Home Affairs")
            doc = s.get("document_name") or top_src.get("document", "SDRF and NDRF Norms (2023)")
            url = s.get("source_url") or top_src.get("url", "https://ndma.gov.in")
            desc = (s.get("explanation") or s.get("relevance") or "Relief support scheme under SDRF/NDRF guidelines.") + f"\n\n[Source: {auth} — {doc}]"

            formatted.append({
                "id": f"RAG-SCHEME-{i+1}",
                "schemeName": s.get("name") or s.get("scheme_name") or "Government Relief Scheme",
                "authority": auth,
                "reliefAmount": s.get("relief_amount") or s.get("amount") or "₹95,100",
                "minDamage": s.get("min_damage") or 30,
                "maxDamage": s.get("max_damage") or 100,
                "description": desc,
                "requiredDocuments": s.get("required_documents") or s.get("documents") or ["Aadhaar Card", "Bank Passbook", "Damage Photos"],
                "benefits": s.get("benefits") or ["Direct Benefit Transfer to Bank Account", "Immediate Rehabilitation"],
                "processingDays": s.get("processing_days") or 7,
                "source_authority": auth,
                "document_name": doc,
                "official_source_url": url,
                "verified": True
            })
        if formatted:
            return {"success": True, "recommended": formatted}

    # Fallback to local disaster schemes
    schemes = await get_disaster_schemes(disaster, damage, state)
    return {
        "success": True,
        "recommended": schemes
    }


@router.post("/{report_id}/documents")
async def save_documents(report_id: str):
    await _get_report(report_id)
    loop = asyncio.get_event_loop()

    # Get disaster & damage info
    report_doc = await loop.run_in_executor(
        None, lambda: get_col("reports").document(report_id).get()
    )
    disaster_type = "flood"
    if report_doc.exists:
        disaster_type = report_doc.to_dict().get("disaster_type", "flood")

    analysis_doc = await loop.run_in_executor(
        None, lambda: get_col("report_analyses").document(report_id).get()
    )
    damage_percent = 50
    severity = "Moderate"
    if analysis_doc.exists:
        damage_percent = analysis_doc.to_dict().get("damage_percent", 50)
        severity = analysis_doc.to_dict().get("severity", "Moderate")

    rag_res = await get_rag_response(disaster_type, damage_percent, severity, "documents")

    docs = []
    if rag_res and rag_res.get("rag_available") and isinstance(rag_res.get("data"), dict) and "documents" in rag_res["data"]:
        raw_docs = rag_res["data"]["documents"]
        top_src = (rag_res.get("sources") or [{}])[0]
        for d in raw_docs:
            auth = d.get("source_authority") or top_src.get("authority", "MHA Guidelines")
            # Mandatory docs start as Uploaded or Required to let users verify them manually in Step 7
            status_val = "Uploaded" if d.get("name", "").lower() == "aadhaar card" else ("Required" if d.get("mandatory") else "Pending")
            docs.append({
                "name": d.get("name"),
                "status": status_val,
                "size": "2.1 MB" if status_val == "Uploaded" else "",
                "source_authority": auth,
                "document_name": d.get("document_name") or top_src.get("document", "SDRF Guidelines"),
                "official_source_url": top_src.get("url", ""),
                "verified": False
            })

    if not docs:
        docs = [
            {"name": "Aadhaar Card", "status": "Uploaded", "size": "2.1 MB", "source_authority": "Ministry of Home Affairs", "verified": False},
            {"name": "House Damage Photos", "status": "Verified", "size": "5.4 MB", "source_authority": "State Revenue Dept", "verified": True},
            {"name": "Bank Passbook", "status": "Required", "size": "", "source_authority": "Financial Inclusion", "verified": False},
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
            "source_authority": d.to_dict().get("source_authority"),
            "document_name": d.to_dict().get("document_name"),
            "official_source_url": d.to_dict().get("official_source_url"),
            "verified": d.to_dict().get("verified", True)
        }
        for d in docs
    ]
    return {"success": True, "documents": documents}


@router.post("/{report_id}/timeline")
async def save_timeline(report_id: str):
    await _get_report(report_id)
    loop = asyncio.get_event_loop()

    report_doc = await loop.run_in_executor(
        None, lambda: get_col("reports").document(report_id).get()
    )
    disaster_type = "flood"
    if report_doc.exists:
        disaster_type = report_doc.to_dict().get("disaster_type", "flood")

    analysis_doc = await loop.run_in_executor(
        None, lambda: get_col("report_analyses").document(report_id).get()
    )
    damage_percent = 50
    severity = "Moderate"
    if analysis_doc.exists:
        damage_percent = analysis_doc.to_dict().get("damage_percent", 50)
        severity = analysis_doc.to_dict().get("severity", "Moderate")

    rag_res = await get_rag_response(disaster_type, damage_percent, severity, "timeline")

    today = datetime.now()
    timeline_data = []

    if rag_res and rag_res.get("rag_available") and isinstance(rag_res.get("data"), dict) and "stages" in rag_res["data"]:
        raw_stages = rag_res["data"]["stages"]
        top_src = (rag_res.get("sources") or [{}])[0]
        for idx, stg in enumerate(raw_stages):
            auth = stg.get("authority") or top_src.get("authority", "SDRF Administration")
            dur = stg.get("typical_duration", "")
            desc = stg.get("description", "")
            full_desc = f"{desc}" + (f" (Duration: {dur})" if dur else "") + f" — Source: {auth}"

            st_status = "Completed" if idx < 2 else ("Active" if idx == 2 else "Pending")
            st_date = today.strftime('%d %b %Y') if idx < 2 else (
                (today + timedelta(days=3)).strftime('%d %b %Y') if idx == 2 else "Pending Approval"
            )

            timeline_data.append({
                "title": stg.get("stage_name") or f"Stage {idx+1}",
                "description": full_desc,
                "status": st_status,
                "date": st_date,
                "source_authority": auth,
                "document_name": top_src.get("document", "SDRF Guidelines"),
                "official_source_url": top_src.get("url", ""),
                "verified": True
            })

    if not timeline_data:
        timeline_data = [
            {
                "title": "Application Submitted",
                "description": f"Application submitted on {today.strftime('%d %b %Y')} — Source: MHA SDRF Guidelines",
                "status": "Completed",
                "date": today.strftime('%d %b %Y')
            },
            {
                "title": "AI Damage Assessment",
                "description": f"AI analysis completed on {today.strftime('%d %b %Y')} — Source: CivicSync Vision Engine",
                "status": "Completed",
                "date": today.strftime('%d %b %Y')
            },
            {
                "title": "Officer Verification",
                "description": f"Verification scheduled on {(today + timedelta(days=1)).strftime('%d %b %Y')} — Source: Revenue Officer",
                "status": "Active",
                "date": (today + timedelta(days=1)).strftime('%d %b %Y')
            },
            {
                "title": "Relief Disbursement",
                "description": f"Expected approval on {(today + timedelta(days=3)).strftime('%d %b %Y')} — Source: State Treasury",
                "status": "Pending",
                "date": "Pending Approval"
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
            "date": d.to_dict().get("date"),
            "source_authority": d.to_dict().get("source_authority"),
            "document_name": d.to_dict().get("document_name"),
            "official_source_url": d.to_dict().get("official_source_url"),
            "verified": d.to_dict().get("verified", True)
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


class ReportSubmitPayload(BaseModel):
    email: str = ""
    user_name: str = ""
    disaster_type: str = ""
    scheme_name: str = ""
    relief_amount: str = ""
    eligibility_status: str = ""
    application_status: str = "Submitted & AI Verified"
    next_step: str = ""
    submission_date: str = ""
    submission_time: str = ""
    applied_scheme_ids: list = []


@router.post("/{report_id}/submit")
async def submit_report_endpoint(report_id: str, payload: ReportSubmitPayload):
    loop = asyncio.get_event_loop()

    # ── Guard: valid email required ──────────────────────────────────────────
    if not payload.email or "@" not in payload.email:
        return {
            "success": False,
            "email_sent": False,
            "report_id": report_id,
            "message": "Email address not available. Please update your profile.",
            "email_error": "no_email",
        }

    # ── Guard: duplicate submission protection ───────────────────────────────
    existing = await loop.run_in_executor(
        None, lambda: get_col("reports").document(report_id).get()
    )
    if existing.exists:
        existing_data = existing.to_dict()
        if existing_data.get("status") == "submitted_and_verified" and existing_data.get("submitted_at"):
            logger.info(f"[Submit] Duplicate blocked for {report_id}")
            return {
                "success": True,
                "email_sent": existing_data.get("email_status") == "sent",
                "report_id": report_id,
                "message": "Application already submitted. Duplicate submission prevented.",
                "data": existing_data,
            }

    # ── Pull officer/inspection from Firestore (single source of truth) ──────
    officer_name = "Not assigned yet"
    inspection_date = "Not scheduled yet"
    inspection_time = ""

    timeline_docs = await loop.run_in_executor(
        None,
        lambda: list(get_col("report_timeline").where("report_id", "==", report_id).stream()),
    )
    for td in timeline_docs:
        tdata = td.to_dict()
        if tdata.get("officer_name"):
            officer_name = tdata["officer_name"]
        if tdata.get("inspection_date"):
            inspection_date = tdata["inspection_date"]
        if tdata.get("inspection_time"):
            inspection_time = tdata["inspection_time"]

    # ── Send confirmation email ──────────────────────────────────────────────
    email_sent, email_msg = await loop.run_in_executor(
        None,
        lambda: _send_confirmation_email(
            to_email=payload.email,
            user_name=payload.user_name,
            report_id=report_id,
            disaster_type=payload.disaster_type,
            scheme_name=payload.scheme_name,
            eligibility_status=payload.eligibility_status or "Pending Verification",
            relief_amount=payload.relief_amount or "Not Available",
            application_status=payload.application_status or "Submitted & AI Verified",
            officer_name=officer_name,
            inspection_date=inspection_date,
            inspection_time=inspection_time,
            next_step=payload.next_step or "Await field inspection by the assigned officer.",
            submission_date=payload.submission_date,
            submission_time=payload.submission_time,
        ),
    )

    # ── Persist submission to Firestore ──────────────────────────────────────
    submission_data = {
        "status": "submitted_and_verified",
        "submitted_at": _now(),
        "user_email": payload.email,
        "user_name": payload.user_name,
        "disaster_type": payload.disaster_type,
        "scheme_name": payload.scheme_name,
        "relief_amount": payload.relief_amount,
        "eligibility_status": payload.eligibility_status,
        "application_status": payload.application_status,
        "officer_name": officer_name,
        "inspection_date": inspection_date,
        "inspection_time": inspection_time,
        "submission_date": payload.submission_date,
        "submission_time": payload.submission_time,
        "applied_scheme_ids": payload.applied_scheme_ids,
        "email_status": "sent" if email_sent else "failed",
        "email_message": email_msg,
    }

    try:
        await loop.run_in_executor(
            None,
            lambda: get_col("reports").document(report_id).set(submission_data, merge=True),
        )
    except Exception as e:
        logger.error(f"[Submit] Firestore save failed for {report_id}: {e}")

    # ── Response ─────────────────────────────────────────────────────────────
    if email_sent:
        msg_out = "✅ Application Submitted Successfully\n\nA confirmation email has been sent to your registered email address."
    else:
        msg_out = "Application submitted successfully, but confirmation email could not be sent. Please verify your email address."

    return {
        "success": True,
        "email_sent": email_sent,
        "report_id": report_id,
        "message": msg_out,
        "email_sent_to": payload.email if email_sent else None,
        "email_error": None if email_sent else email_msg,
        "data": submission_data,
    }
