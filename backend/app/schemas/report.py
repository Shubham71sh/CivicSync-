from pydantic import BaseModel

class ReportCreate(BaseModel):
    disaster_type: str
    location: str
    description: str