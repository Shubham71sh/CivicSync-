from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime

from app.db.database import Base


class Analysis(Base):
    __tablename__ = "analysis"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        String,
        ForeignKey("reports.report_id"),
        nullable=False
    )

    damage_percent = Column(Float)

    severity = Column(String)

    house_damage = Column(Float)

    crop_damage = Column(Float)

    vehicle_damage = Column(Float)

    estimated_loss = Column(Float)

    ai_confidence = Column(Float)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )