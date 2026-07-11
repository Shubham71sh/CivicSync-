from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.db.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String, unique=True, index=True, nullable=False)

    disaster_type = Column(String, nullable=False)

    location = Column(String)

    description = Column(String)

    status = Column(String, default="Pending")

    created_at = Column(DateTime, default=datetime.utcnow)