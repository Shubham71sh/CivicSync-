"""
GPS service — Firestore-based Civic AI Journey Planner.
"""

import asyncio
import uuid
import logging
from datetime import datetime, timedelta
from math import ceil
from fastapi import HTTPException
from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")


def _s(doc, doc_id=None) -> dict:
    d = dict(doc)
    if doc_id:
        d["id"] = doc_id
    return d


async def _init_gps(uid: str):
    """Seed GPS data (tasks, recommendations, calendar events) if first visit."""
    loop = asyncio.get_event_loop()

    def _fetch():
        t = list(get_col("tasks").where("userId", "==", uid).limit(1).stream())
        r = list(get_col("recommendations").where("userId", "==", uid).limit(1).stream())
        e = list(get_col("calendarevents").where("userId", "==", uid).limit(1).stream())
        return t, r, e

    tasks, recs, events = await loop.run_in_executor(None, _fetch)
    now = datetime.utcnow().isoformat()

    def _seed():
        if not tasks:
            for item in [
                {"userId": uid, "title": "Upload Income Certificate",
                 "description": "Required for PM Awas Yojana.", "priority": "high",
                 "category": "document", "status": "pending",
                 "dueDate": (datetime.utcnow() + timedelta(days=5)).isoformat(), "createdAt": now},
                {"userId": uid, "title": "Complete Aadhaar e-KYC Verification",
                 "description": "Enable Direct Benefit Transfer.", "priority": "high",
                 "category": "verification", "status": "pending",
                 "dueDate": (datetime.utcnow() + timedelta(days=10)).isoformat(), "createdAt": now},
            ]:
                get_col("tasks").document(str(uuid.uuid4())).set(item)

        if not recs:
            for item in [
                {"userId": uid, "title": "PM Kisan Samman Nidhi",
                 "description": "Get ₹6,000/year direct income support.",
                 "type": "scheme", "benefitValue": "₹6,000/year", "matchScore": 92, "createdAt": now},
                {"userId": uid, "title": "Ayushman Bharat PM-JAY",
                 "description": "Cashless health insurance up to ₹5 Lakh.",
                 "type": "scheme", "benefitValue": "₹5,00,000 Cover", "matchScore": 88, "createdAt": now},
            ]:
                get_col("recommendations").document(str(uuid.uuid4())).set(item)

        if not events:
            for item in [
                {"userId": uid, "title": "PMAY Urban Registration Deadline",
                 "description": "Final date to file online housing grants.", "type": "deadline",
                 "date": (datetime.utcnow() + timedelta(days=12)).isoformat(), "createdAt": now},
                {"userId": uid, "title": "Mudra Loan Interview Appointment",
                 "description": "Verification slot at State Bank of India.",
                 "type": "appointment",
                 "date": (datetime.utcnow() + timedelta(days=3)).isoformat(), "createdAt": now},
            ]:
                get_col("calendarevents").document(str(uuid.uuid4())).set(item)

    await loop.run_in_executor(None, _seed)


async def get_gps_dashboard(uid: str) -> dict:
    await _init_gps(uid)
    loop = asyncio.get_event_loop()

    def _fetch():
        apps = list(get_col("applications").where("userId", "==", uid).stream())
        docs = list(get_col("documents").where("userId", "==", uid).stream())
        pending_tasks = list(get_col("tasks").where("userId", "==", uid).where("status", "==", "pending").stream())
        roadmap_doc = get_col("roadmaps").document(uid).get()
        return apps, docs, pending_tasks, roadmap_doc

    apps, docs, pending_tasks, roadmap_doc = await loop.run_in_executor(None, _fetch)

    items = roadmap_doc.to_dict().get("items", []) if roadmap_doc.exists else []
    completed = sum(1 for i in items if i.get("status") == "completed")
    completion = round((completed / len(items)) * 100) if items else 0

    return {"dashboard": {
        "roadmapCompletion": completion,
        "applicationsSubmitted": len(apps),
        "applicationsApproved": sum(1 for a in apps if a.to_dict().get("status") == "approved"),
        "applicationsPending": sum(1 for a in apps if a.to_dict().get("status") in ["submitted", "pending", "under_review"]),
        "applicationsRejected": sum(1 for a in apps if a.to_dict().get("status") == "rejected"),
        "benefitsClaimed": sum(1 for a in apps if a.to_dict().get("status") == "approved"),
        "pendingTasksCount": len(pending_tasks),
        "documentsUploadedCount": len(docs),
    }}


async def get_gps_roadmap(uid: str) -> dict:
    from app.services.roadmap_service import get_roadmap
    return await get_roadmap(uid)


async def generate_roadmap(uid: str) -> dict:
    loop = asyncio.get_event_loop()

    def _fetch():
        docs = list(get_col("documents").where("userId", "==", uid).stream())
        apps = list(get_col("applications").where("userId", "==", uid).stream())
        return docs, apps

    doc_list, app_list = await loop.run_in_executor(None, _fetch)

    has_income_cert = any(
        d.to_dict().get("name") == "Income Certificate" and d.to_dict().get("status") == "verified"
        for d in doc_list
    )
    completed_apps = sum(1 for a in app_list if a.to_dict().get("status") == "approved")
    now = datetime.utcnow().isoformat()

    items = [
        {"title": "Current Status: Profile Verified", "date": "Step Completed",
         "desc": "Citizen profile verified.", "status": "completed", "badge": "Verified", "icon": "CheckCircle2"},
        {"title": "Eligible Schemes Identification", "date": "Determined",
         "desc": "AI flagged eligible schemes.", "status": "completed", "badge": "Ready", "icon": "Award"},
    ]

    if has_income_cert:
        items.append({"title": "Required Documents Verification", "date": "Compliance Met",
                      "desc": "All critical certificates verified.", "status": "completed",
                      "badge": "Clear", "icon": "CheckCircle2"})
    else:
        items.append({"title": "Required Documents Verification", "date": "Action Required",
                      "desc": "Missing: Verified Income Certificate.", "status": "action_required",
                      "badge": "Gap Found", "icon": "AlertCircle"})

    if app_list:
        items.append({"title": "Application Forms Submission", "date": f"{len(app_list)} Filed",
                      "desc": "Active tracking enabled.", "status": "completed",
                      "badge": "In Progress", "icon": "FileText"})
    else:
        items.append({"title": "Application Forms Submission", "date": "Pending File",
                      "desc": "Search and apply for schemes.", "status": "upcoming",
                      "badge": "Locked", "icon": "Clock"})

    items.append({
        "title": "Department Verification & Disbursal",
        "date": "Completed" if completed_apps > 0 else "Locked",
        "desc": "Disbursal channels established." if completed_apps > 0 else "Locks until applications are approved.",
        "status": "completed" if completed_apps > 0 else "pending",
        "badge": "Released" if completed_apps > 0 else "Locked",
        "icon": "CheckCircle2" if completed_apps > 0 else "Lock",
    })

    completed = sum(1 for i in items if i.get("status") == "completed")
    actionRequired = sum(1 for i in items if i.get("status") in ["action_required", "actionRequired"])
    upcoming = sum(1 for i in items if i.get("status") == "upcoming")
    pending = sum(1 for i in items if i.get("status") == "pending")

    roadmap_data = {
        "citizenId": uid,
        "items": items,
        "updatedAt": now,
        "summary": {
            "completed": completed,
            "actionRequired": actionRequired,
            "upcoming": upcoming,
            "pending": pending,
        },
    }
    await loop.run_in_executor(None, lambda: get_col("roadmaps").document(uid).set(roadmap_data, merge=True))
    roadmap_data["id"] = uid
    return {"roadmap": roadmap_data}


async def get_gps_tasks(uid: str) -> dict:
    await _init_gps(uid)
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("tasks").where("userId", "==", uid).stream()
    ))
    result = [dict(**d.to_dict(), id=d.id) for d in docs]
    return {"tasks": result}


async def get_gps_documents(uid: str) -> dict:
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("documents").where("userId", "==", uid).stream()
    ))
    result = [dict(**d.to_dict(), id=d.id) for d in docs]
    return {"documents": result}


async def upload_gps_document(uid: str, name: str, file_name: str,
                               file_size: int = 0, file_data: str = None,
                               expiry_date: str = None) -> dict:
    if not name or not file_name:
        raise HTTPException(status_code=400, detail="name and fileName are required.")
    loop = asyncio.get_event_loop()

    # Remove existing doc with same name for this user
    def _cleanup():
        existing = list(get_col("documents").where("userId", "==", uid).where("name", "==", name).stream())
        for d in existing:
            d.reference.delete()

    await loop.run_in_executor(None, _cleanup)

    now = datetime.utcnow().isoformat()
    doc_id = str(uuid.uuid4())
    doc_data = {
        "userId": uid,
        "name": name,
        "fileName": file_name,
        "fileSize": file_size or 0,
        "fileData": file_data,
        "expiryDate": expiry_date,
        "status": "verified",
        "verificationNote": "",
        "isExpired": False,
        "createdAt": now,
        "updatedAt": now,
    }
    await loop.run_in_executor(None, lambda: get_col("documents").document(doc_id).set(doc_data))
    doc_data["id"] = doc_id
    await generate_roadmap(uid)
    return {"document": doc_data}


async def update_gps_document(uid: str, doc_id: str, status: str = None, note: str = None) -> dict:
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("documents").document(doc_id).get())
    if not doc.exists or doc.to_dict().get("userId") != uid:
        raise HTTPException(status_code=404, detail="Document not found.")
    updates = {"updatedAt": datetime.utcnow().isoformat()}
    if status is not None:
        updates["status"] = status
    if note is not None:
        updates["verificationNote"] = note
    await loop.run_in_executor(None, lambda: get_col("documents").document(doc_id).update(updates))
    updated = await loop.run_in_executor(None, lambda: get_col("documents").document(doc_id).get())
    data = updated.to_dict()
    data["id"] = doc_id
    await generate_roadmap(uid)
    return {"document": data}


async def delete_gps_document(uid: str, doc_id: str) -> dict:
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("documents").document(doc_id).get())
    if not doc.exists or doc.to_dict().get("userId") != uid:
        raise HTTPException(status_code=404, detail="Document not found.")
    await loop.run_in_executor(None, lambda: get_col("documents").document(doc_id).delete())
    await generate_roadmap(uid)
    return {"success": True, "message": "Document deleted."}


async def get_gps_schemes(uid: str) -> dict:
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("applications").where("userId", "==", uid).stream()
    ))
    return {"schemes": [dict(**d.to_dict(), id=d.id) for d in docs]}


async def get_gps_recommendations(uid: str) -> dict:
    await _init_gps(uid)
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("recommendations").where("userId", "==", uid).stream()
    ))
    result = sorted([dict(**d.to_dict(), id=d.id) for d in docs],
                    key=lambda x: x.get("matchScore", 0), reverse=True)
    return {"recommendations": result}


async def get_gps_deadlines(uid: str) -> dict:
    await _init_gps(uid)
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("calendarevents").where("userId", "==", uid).where("type", "==", "deadline").stream()
    ))
    now = datetime.utcnow()
    result = []
    for doc in docs:
        d = dict(**doc.to_dict(), id=doc.id)
        date_str = d.get("date")
        if date_str:
            try:
                dt = datetime.fromisoformat(date_str)
                diff = (dt - now).total_seconds()
                d["daysLeft"] = max(0, ceil(diff / 86400))
            except Exception:
                pass
        result.append(d)
    return {"deadlines": result}


async def get_gps_calendar(uid: str) -> dict:
    await _init_gps(uid)
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("calendarevents").where("userId", "==", uid).stream()
    ))
    return {"events": [dict(**d.to_dict(), id=d.id) for d in docs]}


async def get_application_progress(uid: str) -> dict:
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("applications").where("userId", "==", uid).stream()
    ))
    return {"applications": [dict(**d.to_dict(), id=d.id) for d in docs]}


async def get_gps_notifications(uid: str) -> dict:
    loop = asyncio.get_event_loop()
    docs = await loop.run_in_executor(None, lambda: list(
        get_col("notifications").where("userId", "==", uid).stream()
    ))
    result = sorted([dict(**d.to_dict(), id=d.id) for d in docs],
                    key=lambda x: x.get("createdAt", ""), reverse=True)[:10]
    return {"notifications": result}
