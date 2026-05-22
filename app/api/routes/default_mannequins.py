import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.default_mannequin_service import (
    get_default_mannequins,
    get_default_mannequin,
)
from app.services.job_service import create_job, update_mannequin_result, update_job_status


router = APIRouter(
    prefix="/api/v1/default-mannequins",
    tags=["Default Mannequins"]
)


def serialize_default_mannequin(mannequin):
    return {
        "code": mannequin.code,
        "name": mannequin.name,
        "gender": mannequin.gender,
        "body_type": mannequin.body_type,
        "mannequin_obj_url": mannequin.mannequin_obj_url,
        "mannequin_mesh_url": mannequin.mannequin_mesh_url,
        "front_image_url": mannequin.front_image_url,
        "thumbnail_url": mannequin.thumbnail_url,
        "created_at": mannequin.created_at.isoformat() if mannequin.created_at else None,
    }


@router.get("")
def read_default_mannequins(db: Session = Depends(get_db)):
    mannequins = get_default_mannequins(db)

    return {
        "success": True,
        "message": "Default mannequins found",
        "data": [serialize_default_mannequin(m) for m in mannequins]
    }


@router.get("/{code}")
def read_default_mannequin(code: str, db: Session = Depends(get_db)):
    mannequin = get_default_mannequin(db, code)

    if not mannequin:
        raise HTTPException(status_code=404, detail="Default mannequin not found")

    return {
        "success": True,
        "message": "Default mannequin found",
        "data": serialize_default_mannequin(mannequin)
    }


@router.post("/{code}/jobs")
def create_job_with_default_mannequin(code: str, db: Session = Depends(get_db)):
    mannequin = get_default_mannequin(db, code)

    if not mannequin:
        raise HTTPException(status_code=404, detail="Default mannequin not found")

    job_id = str(uuid.uuid4())

    job = create_job(
        db=db,
        job_id=job_id,
        category="default_mannequin",
        user_image_path=f"default://{mannequin.code}",
        cloth_image_path=""
    )

    update_mannequin_result(
        db=db,
        job_id=job_id,
        mannequin_obj_url=mannequin.mannequin_obj_url,
        mannequin_mesh_url=mannequin.mannequin_mesh_url,
        front_image_url=mannequin.front_image_url
    )

    job = update_job_status(db, job_id, "MANNEQUIN_DONE")

    return {
        "success": True,
        "message": "Job created with default mannequin",
        "data": {
            "job_id": job.job_id,
            "status": job.status,
            "category": job.category,
            "default_mannequin_code": mannequin.code,
            "default_mannequin_name": mannequin.name,
            "mannequin_obj_url": job.mannequin_obj_url,
            "mannequin_mesh_url": job.mannequin_mesh_url,
            "front_image_url": job.front_image_url,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        }
    }