import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.schemas.job import JobCreateResponse, JobStatusResponse, JobResultResponse
from app.services.job_service import create_job, get_job
from app.services.file_service import save_uploaded_file
from app.db.session import get_db

router = APIRouter(prefix="/api/v1/jobs", tags=["Jobs"])


@router.post("", response_model=JobCreateResponse)
def create_new_job(
        user_image: UploadFile = File(...),
        cloth_image: UploadFile = File(...),
        category: str = Form(...),
        db: Session = Depends(get_db)
):
    allowed_extensions = [".jpg", ".jpeg", ".png"]
    max_file_size = 10 * 1024 * 1024

    user_ext = os.path.splitext(user_image.filename)[1].lower()
    cloth_ext = os.path.splitext(cloth_image.filename)[1].lower()

    if user_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid user image format")

    if cloth_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid cloth image format")

    if category not in ["top", "bottom", "dress"]:
        raise HTTPException(status_code=400, detail="Invalid category")

    user_contents = user_image.file.read()
    cloth_contents = cloth_image.file.read()

    if len(user_contents) > max_file_size:
        raise HTTPException(status_code=400, detail="User image size exceeds 10MB")

    if len(cloth_contents) > max_file_size:
        raise HTTPException(status_code=400, detail="Cloth image size exceeds 10MB")

    user_image.file.seek(0)
    cloth_image.file.seek(0)

    job_id = str(uuid.uuid4())

    user_save_path = f"storage/input/{job_id}/user{user_ext}"
    cloth_save_path = f"storage/input/{job_id}/cloth{cloth_ext}"

    save_uploaded_file(user_image, user_save_path)
    save_uploaded_file(cloth_image, cloth_save_path)

    job = create_job(
        db=db,
        job_id=job_id,
        category=category,
        user_image_path=user_save_path,
        cloth_image_path=cloth_save_path
    )

    return {
        "success": True,
        "message": "Job created successfully",
        "data": {
            "job_id": job.job_id,
            "status": job.status,
            "category": job.category,
            "user_image_path": job.user_image_path,
            "cloth_image_path": job.cloth_image_path,
            "result_image_path": job.result_image_path,
            "error_message": job.error_message
        }
    }


@router.get("/{job_id}", response_model=JobStatusResponse)
def read_job(job_id: str, db: Session = Depends(get_db)):
    job = get_job(db, job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "success": True,
        "message": "Job found",
        "data": {
            "job_id": job.job_id,
            "status": job.status,
            "category": job.category,
            "user_image_path": job.user_image_path,
            "cloth_image_path": job.cloth_image_path,
            "result_image_path": job.result_image_path,
            "error_message": job.error_message
        }
    }


@router.get("/{job_id}/result", response_model=JobResultResponse)
def read_job_result(job_id: str, db: Session = Depends(get_db)):
    job = get_job(db, job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.result_image_path:
        return {
            "success": True,
            "message": "Result not ready yet",
            "data": {
                "job_id": job.job_id,
                "status": job.status,
                "result_image_path": None
            }
        }

    return {
        "success": True,
        "message": "Result found",
        "data": {
            "job_id": job.job_id,
            "status": job.status,
            "result_image_path": job.result_image_path
        }
    }