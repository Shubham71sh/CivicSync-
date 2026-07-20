from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationOut(BaseModel):
    id: Optional[str] = None
    type: str = "info"
    iconType: str = "Bell"
    title: str
    desc: Optional[str] = ""
    read: bool = False
    time: str = ""
    createdAt: Optional[datetime] = None
