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
        },
        "eligibility": [
    {
        "label": "Disaster officially declared",
        "desc": "Municipal state of emergency active for Patna Zone 14",
        "status": "Passed"
    },
    {
        "label": "GPS matched",
        "desc": "Evidence geotags overlay within declared incident perimeter coordinates",
        "status": "Passed"
    },
    {
        "label": "Aadhaar verified",
        "desc": "Identity and digital signature validated",
        "status": "Passed"
    },
    {
        "label": "Income eligible",
        "desc": "Household income below threshold",
        "status": "Passed"
    },
    {
        "label": "Damage threshold crossed",
        "desc": "Damage exceeds 40%",
        "status": "Passed"
    }
],

        "images": [
            {
                "id": 1,
                "label": "Front View",
                "url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200",
                "detections": [
                    {
                        "id": "d1",
                        "label": "Wall Crack",
                        "confidence": 92,
                        "severity": "High",
                        "x": "15%",
                        "y": "35%",
                        "w": "30%",
                        "h": "25%"
                    }
                ]
            },
            {
                "id": 2,
                "label": "Roof",
                "url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
                "detections": [
                    {
                        "id": "d2",
                        "label": "Roof Damage",
                        "confidence": 95,
                        "severity": "Severe",
                        "x": "20%",
                        "y": "15%",
                        "w": "40%",
                        "h": "30%"
                    }
                ]
            }
        ],

        "schemes": [
            {
                "id": "S1",
                "name": "State Flood Relief Scheme",
                "amount": "₹10,000",
                "status": "Eligible",
                "guide": "Flood damage above 40%",
                "approvalTime": "3-5 Days"
            },
            {
                "id": "S2",
                "name": "PMAY House Repair",
                "amount": "₹50,000",
                "status": "Eligible",
                "guide": "House damage above 70%",
                "approvalTime": "7-14 Days"
            },
            {
                "id": "S3",
                "name": "Electricity Bill Waiver",
                "amount": "50% Waiver",
                "status": "Eligible",
                "guide": "Power connection affected",
                "approvalTime": "2-3 Days"
            },
            {
                "id": "S4",
                "name": "Crop Compensation",
                "amount": "₹8,500/acre",
                "status": "Ineligible",
                "guide": "Land records not found",
                "approvalTime": "-"
            }
        ],

        "eligibility": {
            "aadhaar": True,
            "residence": True,
            "bank_account": True,
            "income_certificate": False,
            "land_record": False
        },

        "documents": [
            {
                "name": "Aadhaar Card",
                "status": "Verified"
            },
            {
                "name": "Bank Passbook",
                "status": "Verified"
            },
            {
                "name": "Land Record",
                "status": "Missing"
            },
            {
                "name": "Income Certificate",
                "status": "Missing"
            }
        ],

        "timeline": [
            {
                "title": "Application Submitted",
                "status": "Completed"
            },
            {
                "title": "Officer Verification",
                "status": "Pending"
            },
            {
                "title": "Relief Approval",
                "status": "Pending"
            }
        ],

        "nearby_help": [
            {
                "id": 1,
                "type": "Relief Camp",
                "name": "Patna Relief Camp",
                "distance": "1.5 km",
                "time": "5 min",
                "phone": "+91 9876543210",
                "capacity": "120 Spaces"
            },
            {
                "id": 2,
                "type": "Hospital",
                "name": "Patna Medical College",
                "distance": "2.1 km",
                "time": "8 min",
                "phone": "+91 9876500001",
                "capacity": "Emergency Open"
            },
            {
                "id": 3,
                "type": "Food Center",
                "name": "Community Kitchen",
                "distance": "1.8 km",
                "time": "6 min",
                "phone": "+91 9876500002",
                "capacity": "Meals Available"
            },
            {
                "id": 4,
                "type": "Police Station",
                "name": "Kotwali Police Station",
                "distance": "3 km",
                "time": "10 min",
                "phone": "+91 9876500003",
                "capacity": "24x7 Available"
            },
            {
                "id": 5,
                "type": "Electricity Office",
                "name": "Electricity Office",
                "distance": "4 km",
                "time": "12 min",
                "phone": "+91 9876500004",
                "capacity": "Open"
            }
        ]
    }