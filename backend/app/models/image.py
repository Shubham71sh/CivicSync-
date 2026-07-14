from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

from app.db.database import Base


class ReportImage(Base):
    __tablename__ = "report_images"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        String,
        ForeignKey("reports.report_id"),
        nullable=False
    )

    image_path = Column(String, nullable=False)

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )