from fastapi import FastAPI, Request
from pydantic import BaseModel
import os
import uvicorn

app = FastAPI()

# 공유 볼륨 내의 더미 파일 경로 (docker-compose에서 볼륨 설정)
DUMMY_FILE_PATH = "/app/shared/dummy/result.glb"

class GenerateRequest(BaseModel):
    job_id: str
    user_image_path: str
    cloth_image_path: str

@app.get("/ai/health")
def health_check():
    return {"status": "ok"}

@app.post("/ai/mannequin/generate")
async def generate_3d_model(request: GenerateRequest):
    # 가상 구현: 전달받은 job_id와 이미지 경로들을 확인
    print(f"Processing Job ID: {request.job_id}")
    print(f"User Image Path: {request.user_image_path}, Cloth Image Path: {request.cloth_image_path}")

    # 실제 파일이 생성되었다고 가정하고 파일명만 반환
    # 실제 경로는 Nginx 서버의 설정에 따라 외부에서 접근됩니다.
    return {
        "status": "success",
        "message": "3D 모델 생성완료.",
        "data" : {
            "job_id": request.job_id,
            # "image_url": "https://v3b.fal.media/files/b/0a96dfa0/zyHFw_wAmIQPeJhX16jDS_tripo_model_855a2675-0348-4c0f-945d-c543433bda99.glb",
            "image_url": "result.glb"
        }
    }



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=9002, reload=True)


