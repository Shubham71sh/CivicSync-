from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        String,
        ForeignKey("reports.report_id")
    )

    name = Column(String)

    status = Column(String)

    size = Column(String)