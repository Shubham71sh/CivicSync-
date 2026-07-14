from sqlalchemy import Column, Integer, String
from app.db.database import Base

class ClaimTimeline(Base):
    __tablename__ = "claim_timeline"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String, index=True)

    title = Column(String)

    description = Column(String)

    status = Column(String)