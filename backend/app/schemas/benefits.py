from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


class ApplicationOut(BaseModel):
    id: Optional[str] = None
    schemeId: Optional[str] = None
    schemeName: str = ""
    schemeCategory: str = "general"
    status: str = "submitted"
    appliedAt: Optional[datetime] = None
    estimatedBenefit: str = ""
    notes: str = ""
    rejectionReason: str = ""


class ApplyBenefitRequest(BaseModel):
    schemeId: str
    schemeName: Optional[str] = None
    notes: Optional[str] = ""


class UpdateBenefitStatusRequest(BaseModel):
    status: str


class CheckEligibilityRequest(BaseModel):
    schemeId: str
    damagePercent: int

class EligibilityResult(BaseModel):
    eligible: bool
    verdict: str
    matchScore: int
    reasons: List[str] = []
    missingRequirements: List[str] = []
    suggestedSchemes: List[Any] = []
    scheme: Optional[Any] = None
