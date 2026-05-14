import os
import uuid
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session

from app.schemas.job import JobCreateResponse, JobStatusResponse, JobResultResponse
from app.services.job_service import (
    create_job,
    get_job,
    get_all_jobs,
    update_job_status,
    update_job_result,
    update_job_error,
    update_mannequin_result,
)
from app.services.file_service import save_uploaded_file
from app.db.session import get_db

router = APIRouter(prefix="/api/v1/jobs", tags=["Jobs"])

@router.post("/mannequin")
def create_mannequin(
        user_image: UploadFile = File(...),
        db: Session = Depends(get_db)
):
    allowed_extensions = [".jpg", ".jpeg", ".png"]
    max_file_size = 10 * 1024 * 1024

    user_ext = os.path.splitext(user_image.filename)[1].lower()

    if user_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid user image format")

    user_contents = user_image.file.read()
    if len(user_contents) > max_file_size:
        raise HTTPException(status_code=400, detail="User image size exceeds 10MB")

    user_image.file.seek(0)

    job_id = str(uuid.uuid4())
    user_save_path = f"storage/input/{job_id}/user{user_ext}"

    save_uploaded_file(user_image, user_save_path)

    create_job(
        db=db,
        job_id=job_id,
        category="mannequin",
        user_image_path=user_save_path,
        cloth_image_path=""
    )

    try:
        update_job_status(db, job_id, "PROCESSING")

        with open(user_save_path, "rb") as f:
            response = httpx.post(
                "http://ai_server:9002/ai/preprocess/human",
                files={
                    "file": (
                        os.path.basename(user_save_path),
                        f,
                        user_image.content_type or "application/octet-stream"
                    )
                },
                timeout=120.0
            )

        if response.status_code != 200:
            update_job_error(db, job_id, f"AI server failed: {response.status_code}")
            raise HTTPException(status_code=500, detail="AI server mannequin generation failed")

        result_data = response.json()
        urls = result_data.get("urls", {})

        job = update_mannequin_result(
            db=db,
            job_id=job_id,
            mannequin_obj_url=urls.get("mannequin_obj"),
            mannequin_mesh_url=urls.get("mannequin_mesh"),
            front_image_url=urls.get("front_image")
        )

        update_job_status(db, job_id, "COMPLETED")
        job = get_job(db, job_id)

        return {
            "success": True,
            "message": "Mannequin created successfully",
            "data": {
                "job_id": job.job_id,
                "status": job.status,
                "user_image_path": job.user_image_path,
                "mannequin_obj_url": job.mannequin_obj_url,
                "mannequin_mesh_url": job.mannequin_mesh_url,
                "front_image_url": job.front_image_url,
                "created_at": job.created_at.isoformat() if job.created_at else None
            }
        }

    except Exception as e:
        update_job_error(db, job_id, f"Mannequin generation failed: {str(e)}")
        raise

@router.post("/fitting")
def create_fitting(
        job_id: str = Form(...),
        cloth_image: UploadFile = File(...),
        db: Session = Depends(get_db)
):
    allowed_extensions = [".jpg", ".jpeg", ".png"]
    max_file_size = 10 * 1024 * 1024

    cloth_ext = os.path.splitext(cloth_image.filename)[1].lower()

    if cloth_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid cloth image format")

    cloth_contents = cloth_image.file.read()
    if len(cloth_contents) > max_file_size:
        raise HTTPException(status_code=400, detail="Cloth image size exceeds 10MB")

    cloth_image.file.seek(0)

    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.mannequin_obj_url or not job.mannequin_mesh_url:
        raise HTTPException(status_code=400, detail="Mannequin data not ready")

    cloth_save_path = f"storage/input/{job_id}/cloth{cloth_ext}"
    save_uploaded_file(cloth_image, cloth_save_path)

    try:
        update_job_status(db, job_id, "PROCESSING")

        response = httpx.post(
            "http://ai_server:9002/ai/fitting/generate",
            json={
                "job_id": job_id,
                "mannequin_obj_url": job.mannequin_obj_url,
                "mannequin_mesh_url": job.mannequin_mesh_url,
                "cloth_image_url": cloth_save_path
            },
            timeout=120.0
        )

        if response.status_code != 200:
            update_job_error(db, job_id, f"AI fitting failed: {response.status_code}")
            raise HTTPException(status_code=500, detail="AI fitting generation failed")

        result_data = response.json()
        data = result_data.get("data", {})

        glb_url = data.get("glb_url") or "http://localhost/static/result.glb"

        job = update_job_result(
            db=db,
            job_id=job_id,
            result_image_path=glb_url,
            model_mesh_url=glb_url,
            preview_image_url=glb_url,
            task_id=data.get("task_id", job_id)
        )

        return {
            "success": True,
            "message": "Fitting created successfully",
            "data": {
                "job_id": job.job_id,
                "status": job.status,
                "mannequin_obj_url": job.mannequin_obj_url,
                "mannequin_mesh_url": job.mannequin_mesh_url,
                "result_image_path": job.result_image_path,
                "model_mesh_url": job.model_mesh_url,
                "preview_image_url": job.preview_image_url,
                "task_id": job.task_id,
                "created_at": job.created_at.isoformat() if job.created_at else None
            }
        }

    except Exception as e:
        update_job_error(db, job_id, f"Fitting generation failed: {str(e)}")
        raise


def trigger_ai_server(db: Session, job_id: str, user_image_path: str, cloth_image_path: str):
    try:
        update_job_status(db, job_id, "PROCESSING")

        response = httpx.post(
            "http://ai_server:9002/ai/mannequin/generate",
            json={
                "job_id": job_id,
                "body_image_url": user_image_path,
                "clothing_image_url": cloth_image_path,
            },
            timeout=30.0,
        )

        if response.status_code == 200:
            result_data = response.json()
            data = result_data.get("data", {})

            task_id = data.get("task_id")
            model_mesh = data.get("model_mesh", {})
            rendered_image = data.get("rendered_image", {})

            model_mesh_url = model_mesh.get("url")
            preview_image_url = rendered_image.get("url")

            legacy_image_url = data.get("image_url")

            if not model_mesh_url and legacy_image_url:
                model_mesh_url = legacy_image_url

            if not preview_image_url and legacy_image_url:
                preview_image_url = legacy_image_url

            result_image_path = model_mesh_url

            updated_job = update_job_result(
                db=db,
                job_id=job_id,
                result_image_path=result_image_path,
                model_mesh_url=model_mesh_url,
                preview_image_url=preview_image_url,
                task_id=task_id
            )
            return updated_job
        else:
            error_message = f"AI server failed with status {response.status_code}"
            updated_job = update_job_error(db, job_id, error_message)
            return updated_job

    except Exception as e:
        updated_job = update_job_error(db, job_id, f"AI processing failed: {str(e)}")
        return updated_job


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

    create_job(
        db=db,
        job_id=job_id,
        category=category,
        user_image_path=user_save_path,
        cloth_image_path=cloth_save_path
    )

    job = trigger_ai_server(
        db=db,
        job_id=job_id,
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
            "model_mesh_url": job.model_mesh_url,
            "preview_image_url": job.preview_image_url,
            "task_id": job.task_id,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }
    }


@router.get("")
def read_all_jobs(db: Session = Depends(get_db)):
    jobs = get_all_jobs(db)

    return {
        "success": True,
        "message": "Jobs found",
        "data": [
            {
                "job_id": job.job_id,
                "status": job.status,
                "category": job.category,
                "thumbnail_url": job.preview_image_url or job.result_image_path,
                "mannequin_url": job.model_mesh_url or job.result_image_path,
                "created_at": job.created_at.isoformat() if job.created_at else None
            }
            for job in jobs
        ]
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
            "mannequin_url": job.model_mesh_url or job.result_image_path,
            "preview_image_url": job.preview_image_url or job.result_image_path,
            "task_id": job.task_id,
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat() if job.created_at else None
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
                "result_image_path": None,
                "mannequin_url": None,
                "preview_image_url": None,
                "task_id": job.task_id,
                "created_at": job.created_at.isoformat() if job.created_at else None
            }
        }



    return {
        "success": True,
        "message": "Result found",
        "data": {
            "job_id": job.job_id,
            "status": job.status,
            "result_image_path": job.result_image_path,
            "mannequin_url": job.model_mesh_url or job.result_image_path,
            "preview_image_url": job.preview_image_url or job.result_image_path,
            "task_id": job.task_id,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }
    }