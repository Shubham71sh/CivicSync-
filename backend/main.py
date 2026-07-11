from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import reports
from app.db.database import Base, engine
from app.models.report import Report
from app.models.image import ReportImage
from app.models.analysis import Analysis


app = FastAPI(
    title="CivicSync AI Backend",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)
app.include_router(reports.router)

# Allow React Frontend
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "🚀 CivicSync Backend Running Successfully"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "server": "running"
    }

@app.post("/reports/{report_id}/nearby-help")
def save_nearby_help(report_id: str):
    return {
        "success": True,
        "message": "Nearby help saved"
    }


@app.get("/reports/{report_id}/nearby-help")
def get_nearby_help(report_id: str):
    return {
        "success": True,
        "services": [
            {
    "id": 1,
    "name": "Civil Hospital",
    "type": "Hospital",
    "distance": "1.8 km",
    "time": "5 min",
    "capacity": "24 Beds",
    "phone": "108",
    "address": "Main Road"
},
            {
    "id": 2,
    "name": "District Relief Camp",
    "type": "Relief Camp",
    "distance": "850 m",
    "time": "2 min",
    "capacity": "300 People",
    "phone": "1070",
    "address": "Government School"
},
            {
    "id": 3,
    "name": "Police Station",
    "type": "Police Station",
    "distance": "2.3 km",
    "time": "7 min",
    "capacity": "24x7",
    "phone": "100",
    "address": "Sector 5"
},
        ]
    }