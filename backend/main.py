from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import reports

app = FastAPI(
    title="CivicSync AI Backend",
    version="1.0.0"
)
app.include_router(reports.router)

# Allow React Frontend
origins = [
    "http://localhost:5173",
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