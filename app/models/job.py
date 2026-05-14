from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(String, primary_key=True, index=True)
    status = Column(String, nullable=False)
    category = Column(String, nullable=False)
    user_image_path = Column(Text, nullable=False)
    cloth_image_path = Column(Text, nullable=True)

    result_image_path = Column(Text, nullable=True)
    model_mesh_url = Column(Text, nullable=True)
    preview_image_url = Column(Text, nullable=True)
    task_id = Column(String, nullable=True)

    mannequin_obj_url = Column(Text, nullable=True)
    mannequin_mesh_url = Column(Text, nullable=True)
    front_image_url = Column(Text, nullable=True)

    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)