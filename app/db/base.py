from app.db.session import engine, Base
from app.models.job import Job
from app.models.default_mannequin import DefaultMannequin


def create_tables():
    Base.metadata.create_all(bind=engine)