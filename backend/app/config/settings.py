import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load env variables from backend/.env if present
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicSync Transparency Engine"
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "civicsync")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # JWT authentication settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "civicsync_super_secret_key_change_me_in_production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # File upload settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"))

    class Config:
        case_sensitive = True

settings = Settings()
