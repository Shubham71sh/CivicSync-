from sqlalchemy import Column, Integer, String
from app.db.database import Base


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String, index=True)

    name = Column(String)

    role = Column(String)

    zone = Column(String)

    phone = Column(String)

    inspection_date = Column(String)

    inspection_time = Column(String)

    note = Column(String)