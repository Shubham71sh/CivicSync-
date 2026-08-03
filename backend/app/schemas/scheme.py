from pydantic import BaseModel
from typing import Optional, List, Any


class EligibilityCriteria(BaseModel):
    field: str
    operator: str = "any"
    value: Optional[Any] = None


class SchemeOut(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    category: str
    state: str = "All India"
    incomeLimit: Optional[float] = None
    minimumAge: Optional[int] = None
    maximumAge: Optional[int] = None
    gender: str = "All"
    occupation: str = "All"
    education: str = "None"
    disabilityEligible: bool = False
    category_caste: str = "All"
    benefitAmount: str = "Varies"
    estimatedBenefit: str = "Varies"
    requiredDocuments: List[str] = []
    applicationDeadline: Optional[str] = None
    officialWebsite: str = ""
    matchScore: int = 50
    status: str = "active"
    tags: List[str] = []
    badge: str = "Available"
    badgeBg: str = "bg-accent/10 text-accent border-accent/20"
    eligibilityCriteria: List[EligibilityCriteria] = []


class SchemeListOut(BaseModel):
    schemes: List[SchemeOut]
    total: int
    page: int
    pages: int
    limit: int
