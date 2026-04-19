from sqlalchemy.orm import Session
from app.models.job import Job
import httpx

AI_SERVER_URL = "http://ai_server:9002"

def create_job(db: Session, job_id: str, category: str, user_image_path: str, cloth_image_path: str):
    job = Job(
        job_id=job_id,
        status="PENDING",
        category=category,
        user_image_path=user_image_path,
        cloth_image_path=cloth_image_path,
        result_image_path=None,
        error_message=None
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        job.status = "PROCESSING"
        db.commit()
        db.refresh(job)

        payload = {
            "job_id": job_id,
            "user_image_path": user_image_path,
            "cloth_image_path": cloth_image_path
        }

        with httpx.Client() as client:
            response = client.post(f"{AI_SERVER_URL}/ai/mannequin/generate", json=payload, timeout=600)
            response.raise_for_status()
            result_data = response.json()

            if result_data["status"] == "success":
                job.result_image_path = result_data["data"]["image_url"]
                job.status = "COMPLETED"
            else:
                job.status = "FAILED"
                job.error_message = result_data.get("message", "Unknown error")

    except httpx.RequestError as e:
        job.status = "FAILED"
        job.error_message = f"CONNECTION ERROR: {str(e)}"
    except Exception as e:
        job.status = "FAILED"
        job.error_message = f"ERROR: {str(e)}"
    finally:    
        db.commit()
        db.refresh(job)

    return job


def get_job(db: Session, job_id: str):
    return db.query(Job).filter(Job.job_id == job_id).first()


def update_job_status(db: Session, job_id: str, status: str):
    job = get_job(db, job_id)
    if job:
        job.status = status
        db.commit()
        db.refresh(job)
    return job


def update_job_result(db: Session, job_id: str, result_image_path: str):
    job = get_job(db, job_id)
    if job:
        job.result_image_path = result_image_path
        job.status = "COMPLETED"
        db.commit()
        db.refresh(job)
    return job


def update_job_error(db: Session, job_id: str, error_message: str):
    job = get_job(db, job_id)
    if job:
        job.status = "FAILED"
        job.error_message = error_message
        db.commit()
        db.refresh(job)
    return job