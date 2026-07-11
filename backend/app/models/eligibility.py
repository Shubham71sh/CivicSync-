from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.database import Base


class Eligibility(Base):
    __tablename__ = "eligibility"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        String,
        ForeignKey("reports.report_id"),
        nullable=False
    )

    is_eligible = Column(Boolean)

    scheme_name = Column(String)

    reason = Column(String)