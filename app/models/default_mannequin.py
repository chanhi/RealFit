from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class DefaultMannequin(Base):
    __tablename__ = "default_mannequins"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)

    gender = Column(String, nullable=False)      # male, female
    body_type = Column(String, nullable=False)   # basic, slim, plus

    mannequin_obj_url = Column(Text, nullable=True)
    mannequin_mesh_url = Column(Text, nullable=False)
    front_image_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)