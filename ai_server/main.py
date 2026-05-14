from fastapi import FastAPI, Request, UploadFile, File
from pydantic import BaseModel
import os
import uuid
import uvicorn

app = FastAPI()

# 공유 볼륨 내 더미 파일 경로
DUMMY_DIR = "/app/shared/dummy"
DUMMY_GLB_URL = "http://localhost/static/result.glb"
DUMMY_OBJ_URL = "http://localhost/static/sample.obj"
DUMMY_MESH_URL = "http://localhost/static/sample_mesh.json"
DUMMY_FRONT_URL = "http://localhost/static/sample_front.png"


class GenerateRequest(BaseModel):
    job_id: str
    body_image_url: str
    clothing_image_url: str

class FittingRequest(BaseModel):
    job_id: str
    mannequin_obj_url: str
    mannequin_mesh_url: str
    cloth_image_url: str

@app.post("/ai/fitting/generate")
async def generate_fitting(request: FittingRequest):
    print(f"[fitting] Job ID: {request.job_id}")
    print(f"[fitting] mannequin_obj_url: {request.mannequin_obj_url}")
    print(f"[fitting] mannequin_mesh_url: {request.mannequin_mesh_url}")
    print(f"[fitting] cloth_image_url: {request.cloth_image_url}")

    return {
        "success": True,
        "message": "Fitting generated successfully",
        "data": {
            "task_id": request.job_id,
            "glb_url": "http://localhost/static/result.glb"
        }
    }

@app.get("/ai/health")
def health_check():
    return {"status": "ok"}


@app.post("/ai/preprocess/human")
async def preprocess_human(file: UploadFile = File(...)):
    # 더미 응답용: 실제 저장 없이 URL만 반환
    fake_id = str(uuid.uuid4())[:8]

    print(f"[preprocess] filename={file.filename}, content_type={file.content_type}")

    return {
        "success": True,
        "message": "Human preprocessing completed.",
        "urls": {
            "mannequin_obj": DUMMY_OBJ_URL,
            "mannequin_mesh": DUMMY_MESH_URL,
            "front_image": DUMMY_FRONT_URL
        },
        "meta": {
            "task_id": fake_id,
            "filename": file.filename,
            "content_type": file.content_type
        }
    }


@app.post("/ai/mannequin/generate")
async def generate_3d_model(request: GenerateRequest):
    print(f"[generate] Job ID: {request.job_id}")
    print(f"[generate] Body URL: {request.body_image_url}")
    print(f"[generate] Clothing URL: {request.clothing_image_url}")

    return {
        "status": "success",
        "message": "3D 모델 생성완료.",
        "data": {
            "task_id": request.job_id,
            "model_mesh": {
                "file_size": 6744644,
                "content_type": "application/octet-stream",
                "url": DUMMY_GLB_URL
            },
            "rendered_image": {
                "file_size": 13718,
                "content_type": "image/webp",
                "url": DUMMY_GLB_URL
            }
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=9002, reload=True)
