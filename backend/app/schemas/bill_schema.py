from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class BillResponseModel(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    billNumber: str
    status: str
    uploadedAt: str
    summary: str
    impactScore: int
    userImpact: str
    keyPoints: List[str]
    tags: List[str]
    filePath: Optional[str] = None

    class Config:
        populate_by_name = True

class BillListResponse(BaseModel):
    bills: List[BillResponseModel]
    total: int
    page: int
    pages: int

class BillUploadResponse(BaseModel):
    bill: BillResponseModel
    analysisId: str

class BillDetailResponse(BaseModel):
    bill: BillResponseModel

class BillDeleteResponse(BaseModel):
    success: bool = True
    message: str = "Bill deleted successfully"

class CompareRequest(BaseModel):
    billIds: List[str]

class ComparisonDetails(BaseModel):
    bills: List[BillResponseModel]
    similarities: List[str]
    differences: List[str]

class CompareResponse(BaseModel):
    comparison: ComparisonDetails

class FakeNewsRequest(BaseModel):
    text: str
    url: Optional[str] = None

class FakeNewsResponse(BaseModel):
    verified: bool
    confidence: float
    analysis: str
    sources: List[str]
