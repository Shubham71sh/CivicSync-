from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime, timedelta
import os
import shutil

from app.schemas.report import ReportCreate
from app.db.database import get_db
from app.models.report import Report
from app.models.image import ReportImage
from app.models.analysis import Analysis
from app.services.ai_service import analyze_disaster
from app.services.eligibility_service import check_eligibility
from app.models.document import Document
from app.schemas.document import DocumentCreate
from app.models.timeline import ClaimTimeline
from app.models.nearby_help import NearbyHelp
from app.models.officer import Officer

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.post("/")
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db)
):

    report_id = f"REP-{str(uuid4())[:8]}"

    new_report = Report(
        report_id=report_id,
        disaster_type=report.disaster_type,
        location=report.location,
        description=report.description
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
    "success": True,
    "report_id": new_report.report_id,
    "message": "Report saved successfully",
    "data": {
        "id": new_report.id,
        "report_id": new_report.report_id,
        "disaster_type": new_report.disaster_type,
        "location": new_report.location,
        "description": new_report.description,
        "status": new_report.status,
        "created_at": new_report.created_at
    }
}

@router.post("/{report_id}/upload")
def upload_images(
    report_id: str,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db)
):

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    uploaded_files = []

    report = db.query(Report).filter(
        Report.report_id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    for file in files:

        file_path = os.path.join(upload_dir, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        uploaded_files.append(file.filename)

        new_image = ReportImage(
            report_id=report_id,
            image_path=file_path
        )

        db.add(new_image)

    db.commit()  

    return {
        "success": True,
        "report_id": report_id,
        "uploaded_files": uploaded_files
    }

@router.post("/{report_id}/analyze")
def analyze_report(
    report_id: str,
    db: Session = Depends(get_db)
):

    report = db.query(Report).filter(
        Report.report_id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )
    
    images = db.query(ReportImage).filter(
    ReportImage.report_id == report_id
    ).all()


    image_paths = [
    img.image_path 
    for img in images
]

    print("IMAGE PATHS:", image_paths)


    ai_result = analyze_disaster(
        report.disaster_type,
        image_paths
    )

    print(ai_result)

    analysis = Analysis(
    report_id=report_id,
    damage_percent=ai_result["damage_percent"],
    severity=ai_result["severity"],
    house_damage=ai_result["house_damage"],
    crop_damage=ai_result["crop_damage"],
    vehicle_damage=ai_result["vehicle_damage"],
    estimated_loss=ai_result["estimated_loss"],
    ai_confidence=ai_result["ai_confidence"]
)

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "success": True,
        "report_id": report_id,
        "analysis": {
            "damage_percent": analysis.damage_percent,
            "severity": analysis.severity,
            "house_damage": analysis.house_damage,
            "crop_damage": analysis.crop_damage,
            "vehicle_damage": analysis.vehicle_damage,
            "estimated_loss": analysis.estimated_loss,
            "ai_confidence": analysis.ai_confidence
        }
    }

@router.post("/{report_id}/eligibility")
def eligibility_checker(
    report_id: str,
    db: Session = Depends(get_db)
):

    analysis = db.query(Analysis).filter(
        Analysis.report_id == report_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    result = check_eligibility(
        analysis.damage_percent
    )

    from app.models.eligibility import Eligibility

    eligibility = Eligibility(
        report_id=report_id,
        is_eligible=result["is_eligible"],
        scheme_name=result["scheme_name"],
        reason=result["reason"]
    )

    db.add(eligibility)
    db.commit()
    db.refresh(eligibility)

    return {
        "success": True,
        "eligibility": {
            "is_eligible": eligibility.is_eligible,
            "scheme_name": eligibility.scheme_name,
            "reason": eligibility.reason
        }
    }


@router.get("/")
def get_all_reports(db: Session = Depends(get_db)):

    reports = db.query(Report).all()

    return {
        "success": True,
        "count": len(reports),
        "data": reports
    }

@router.get("/{report_id}")
def get_report(
    report_id: str,
    db: Session = Depends(get_db)
):

    report = db.query(Report).filter(
        Report.report_id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return {
        "id": report.id,
        "report_id": report.report_id,
        "disaster_type": report.disaster_type,
        "location": report.location,
        "description": report.description,
        "status": report.status,
        "created_at": report.created_at
    }

@router.post("/{report_id}/documents")
def save_documents(
    report_id: str,
    db: Session = Depends(get_db)
):

    report = db.query(Report).filter(
        Report.report_id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    docs = [
        {
            "name": "Aadhaar Card",
            "status": "Verified",
            "size": "2.1 MB"
        },
        {
            "name": "House Damage Photos",
            "status": "Verified",
            "size": "5.4 MB"
        },
        {
            "name": "Bank Passbook",
            "status": "Pending",
            "size": ""
        }
    ]

    for d in docs:

        document = Document(
            report_id=report_id,
            name=d["name"],
            status=d["status"],
            size=d["size"]
        )

        db.add(document)

    db.commit()

    return {
        "success": True,
        "documents": docs
    }

@router.get("/{report_id}/documents")
def get_documents(
    report_id: str,
    db: Session = Depends(get_db)
):

    documents = db.query(Document).filter(
        Document.report_id == report_id
    ).all()

    return {
        "success": True,
        "documents": [
            {
                "name": d.name,
                "status": d.status,
                "size": d.size
            }
            for d in documents
        ]
    }

@router.post("/{report_id}/timeline")
def save_timeline(
    report_id: str,
    db: Session = Depends(get_db)
):

    report = db.query(Report).filter(
        Report.report_id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    today = datetime.now()

    timeline_data = [
        {
            "title": "Application Submitted",
            "description": f"Application submitted on {today.strftime('%d %b %Y')}",
            "status": "Completed"
        },
        {
            "title": "AI Damage Assessment",
            "description": f"AI analysis completed on {today.strftime('%d %b %Y')}",
            "status": "Completed"
        },
        {
            "title": "Officer Verification",
            "description": f"Verification scheduled on {(today + timedelta(days=1)).strftime('%d %b %Y')}",
            "status": "Pending"
        },
        {
            "title": "Relief Approved",
            "description": f"Expected approval on {(today + timedelta(days=3)).strftime('%d %b %Y')}",
            "status": "Pending"
        }
    ]

    for item in timeline_data:

        timeline = ClaimTimeline(
            report_id=report_id,
            title=item["title"],
            description=item["description"],
            status=item["status"]
        )

        db.add(timeline)

        officer = Officer(
    report_id=report_id,
    name="Rajesh Kumar",
    role="Block Development Officer",
    zone="Ward 14, Patna",
    phone="+91 9876543210",
    inspection_date=(today + timedelta(days=1)).strftime("%d %b %Y"),
    inspection_time="10:00 AM - 12:00 PM",
    note="Please keep original documents ready during inspection."
)

    db.add(officer)

    db.commit()

    return {
        "success": True,
        "timeline": timeline_data
    }

@router.get("/{report_id}/timeline")
def get_timeline(
    report_id: str,
    db: Session = Depends(get_db)
):

    timeline = db.query(ClaimTimeline).filter(
        ClaimTimeline.report_id == report_id
    ).all()
    officer = db.query(Officer).filter(
    Officer.report_id == report_id
).first()

    return {
    "success": True,

    "timeline": [
        {
            "title": t.title,
            "description": t.description,
            "status": t.status
        }
        for t in timeline
    ],

    "officer": {
        "name": officer.name,
        "role": officer.role,
        "zone": officer.zone,
        "phone": officer.phone,
        "inspectionDate": officer.inspection_date,
        "inspectionTime": officer.inspection_time,
        "note": officer.note
    } if officer else None
}

@router.post("/{report_id}/nearby-help")
def save_nearby_help(
    report_id: str,
    db: Session = Depends(get_db)
):

    report = db.query(Report).filter(
        Report.report_id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    services = [

        {
            "name": "Civil Hospital",
            "type": "Hospital",
            "phone": "108",
            "distance": "1.3 km",
            "time": "5 min",
            "capacity": "Open"
        },

        {
            "name": "Disaster Relief Camp",
            "type": "Relief Camp",
            "phone": "1070",
            "distance": "850 m",
            "time": "2 min",
            "capacity": "250 People"
        },

        {
            "name": "Police Station",
            "type": "Police Station",
            "phone": "100",
            "distance": "2.4 km",
            "time": "7 min",
            "capacity": "24x7"
        },

        {
            "name": "Food Distribution Center",
            "type": "Food Center",
            "phone": "1800-500-222",
            "distance": "1.8 km",
            "time": "6 min",
            "capacity": "Meals Available"
        },

        {
            "name": "Electricity Office",
            "type": "Electricity Office",
            "phone": "1912",
            "distance": "3.2 km",
            "time": "9 min",
            "capacity": "Emergency Support"
        }

    ]

    for s in services:

        help_center = NearbyHelp(
            report_id=report_id,
            name=s["name"],
            type=s["type"],
            phone=s["phone"],
            distance=s["distance"],
            time=s["time"],
            capacity=s["capacity"]
        )

        db.add(help_center)

    db.commit()

    return {
        "success": True,
        "services": services
    }


@router.get("/{report_id}/nearby-help")
def get_nearby_help(
    report_id: str,
    db: Session = Depends(get_db)
):

    services = db.query(NearbyHelp).filter(
        NearbyHelp.report_id == report_id
    ).all()

    return {

        "success": True,

        "services": [

            {

                "id": i + 1,

                "name": s.name,

                "type": s.type,

                "phone": s.phone,

                "distance": s.distance,

                "time": s.time,

                "capacity": s.capacity

            }

            for i, s in enumerate(services)

        ]

    }