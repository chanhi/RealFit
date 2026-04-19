from app.db.session import engine, Base
from app.models.job import Job


def create_tables():
    Base.metadata.create_all(bind=engine)