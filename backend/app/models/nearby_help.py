from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base


class NearbyHelp(Base):
    __tablename__ = "nearby_help"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String, ForeignKey("reports.report_id"))

    name = Column(String)

    type = Column(String)

    phone = Column(String)

    distance = Column(String)

    time = Column(String)

    capacity = Column(String)