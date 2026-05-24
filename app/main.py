from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.appropriate_size import router as size_router
from app.api.routes.default_mannequins import router as default_mannequins_router
from app.db.base import create_tables
from app.db.session import SessionLocal
from app.services.default_mannequin_service import seed_default_mannequins



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_tables()

    db = SessionLocal()
    try:
        seed_default_mannequins(db)
    finally:
        db.close()


app.include_router(health_router)
app.include_router(jobs_router)
app.include_router(size_router)
app.include_router(default_mannequins_router)


@app.get("/")
def read_root():
    return {"message": "hello"}