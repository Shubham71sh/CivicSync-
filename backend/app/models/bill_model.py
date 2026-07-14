from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class BillDocument(BaseModel):
    id: str = Field(alias="_id")  # Map _id to id in JSON serialization
    title: str
    billNumber: str
    status: str = "pending"  # passed, pending, under_review, rejected
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)
    summary: str
    extractedText: str
    impactScore: int = 50
    userImpact: str = ""
    keyPoints: List[str] = []
    tags: List[str] = []
    filePath: Optional[str] = None
    userId: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
