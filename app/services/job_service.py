from sqlalchemy.orm import Session
from app.models.job import Job


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

    return job


def get_job(db: Session, job_id: str):
    return db.query(Job).filter(Job.job_id == job_id).first()


def get_all_jobs(db: Session):
    return db.query(Job).order_by(Job.created_at.desc()).all()


def update_job_status(db: Session, job_id: str, status: str):
    job = get_job(db, job_id)
    if job:
        job.status = status
        db.commit()
        db.refresh(job)
    return job


def update_job_result(
        db: Session,
        job_id: str,
        result_image_path: str,
        model_mesh_url: str = None,
        preview_image_url: str = None,
        task_id: str = None
):
    job = get_job(db, job_id)
    if job:
        job.result_image_path = result_image_path
        job.model_mesh_url = model_mesh_url
        job.preview_image_url = preview_image_url
        job.task_id = task_id
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