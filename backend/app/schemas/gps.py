from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RoadmapItem(BaseModel):
    title: str
    date: str = ""
    desc: str = ""
    status: str = "pending"
    badge: str = ""
    badgeBg: str = ""
    icon: str = "Clock"
    color: str = "textSecondary"


class RoadmapSummary(BaseModel):
    completed: int = 0
    actionRequired: int = 0
    upcoming: int = 0
    pending: int = 0


class RoadmapOut(BaseModel):
    id: Optional[str] = None
    citizenId: Optional[str] = None
    items: List[RoadmapItem] = []
    summary: Optional[RoadmapSummary] = None


class TaskOut(BaseModel):
    id: Optional[str] = None
    title: str
    description: str = ""
    priority: str = "medium"
    category: str = "general"
    status: str = "pending"
    dueDate: Optional[datetime] = None
    createdAt: Optional[datetime] = None


class DocumentOut(BaseModel):
    id: Optional[str] = None
    name: str
    fileName: str
    fileSize: int = 0
    mimeType: str = "application/pdf"
    status: str = "pending"
    verificationNote: str = ""
    expiryDate: Optional[datetime] = None
    isExpired: bool = False
    createdAt: Optional[datetime] = None


class DocumentUploadRequest(BaseModel):
    name: str
    fileName: str
    fileSize: Optional[int] = 0
    fileData: Optional[str] = None
    expiryDate: Optional[str] = None


class DocumentUpdateRequest(BaseModel):
    status: Optional[str] = None
    verificationNote: Optional[str] = None


class RecommendationOut(BaseModel):
    id: Optional[str] = None
    title: str
    description: str = ""
    type: str = "scheme"
    benefitValue: str = ""
    matchScore: int = 50
    whyRecommended: str = ""


class CalendarEventOut(BaseModel):
    id: Optional[str] = None
    title: str
    description: str = ""
    date: Optional[datetime] = None
    type: str = "event"
    daysLeft: Optional[int] = None


class GpsDashboardOut(BaseModel):
    roadmapCompletion: int = 0
    applicationsSubmitted: int = 0
    applicationsApproved: int = 0
    applicationsPending: int = 0
    applicationsRejected: int = 0
    benefitsClaimed: int = 0
    pendingTasksCount: int = 0
    documentsUploadedCount: int = 0
