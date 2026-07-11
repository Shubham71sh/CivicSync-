from pydantic import BaseModel

class TimelineCreate(BaseModel):
    title: str
    description: str
    status: str
    