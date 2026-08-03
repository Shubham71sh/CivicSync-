from pydantic import BaseModel
from typing import Optional, List, Any


class ConnectedId(BaseModel):
    name: str
    verified: bool = False
    verifiedAt: Optional[str] = None


class FamilyMember(BaseModel):
    name: str = ""
    relation: str = ""
    age: Optional[int] = None
    occupation: str = ""


class ProfileOut(BaseModel):
    _id: Optional[str] = None
    id: Optional[str] = None
    firstName: str = ""
    lastName: str = ""
    name: str = ""
    email: str = ""
    avatar: Optional[str] = None
    role: str = "citizen"
    verified: bool = False
    # civic fields
    phone: str = ""
    dob: str = ""
    age: Optional[int] = None
    gender: str = ""
    category: str = ""
    disability: bool = False
    disabilityType: str = ""
    location: str = ""
    address: str = ""
    state: str = ""
    district: str = ""
    pincode: str = ""
    profession: str = ""
    occupation: str = ""
    incomeRange: str = ""
    education: str = ""
    familySize: Optional[int] = None
    familyMembers: List[FamilyMember] = []
    verificationStatus: str = "Unverified"
    connectedIds: List[ConnectedId] = []
    completionPercent: int = 0


class UpdateProfileRequest(BaseModel):
    phone: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    disability: Optional[bool] = None
    disabilityType: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    profession: Optional[str] = None
    occupation: Optional[str] = None
    incomeRange: Optional[str] = None
    income: Optional[str] = None  # alias for incomeRange
    education: Optional[str] = None
    familySize: Optional[int] = None
    verificationStatus: Optional[str] = None


class CitizenProfileStats(BaseModel):
    location: Optional[str] = None
    profession: Optional[str] = None
    incomeRange: Optional[str] = None
    state: Optional[str] = None
    verificationStatus: Optional[str] = None


class DashboardStatsOut(BaseModel):
    billsAnalyzed: int = 0
    schemesAvailable: int = 0
    upcomingDeadlines: int = 0
    corruptionAlerts: int = 0
    unclaimedBenefits: int = 0
    documentsUploaded: int = 0
    profileCompletion: int = 0
    citizenProfile: Optional[CitizenProfileStats] = None
