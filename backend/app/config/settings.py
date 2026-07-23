import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load env variables from root .env or local environment
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))


class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicSync AI Backend"
    
    # Firebase
    FIREBASE_PROJECT_ID: str = "civic-sync-cosmic"
    FIREBASE_STORAGE_BUCKET: str = "civic-sync-cosmic.appspot.com"
    
    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # File upload settings
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    )
    
    # CORS origins
    CLIENT_URL: str = os.getenv("CLIENT_URL", "http://localhost:5173")

    class Config:
        case_sensitive = True


settings = Settings()
