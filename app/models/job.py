from sqlalchemy import Column, String, Text
from app.db.session import Base


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(String, primary_key=True, index=True)
    status = Column(String, nullable=False)
    category = Column(String, nullable=False)
    user_image_path = Column(Text, nullable=False)
    cloth_image_path = Column(Text, nullable=False)
    result_image_path = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)