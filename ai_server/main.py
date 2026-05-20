import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response, JSONResponse
import aiofiles

from services.human_service import HumanService
from services.garment_service import GarmentService
from services.vton import VtonService
from services.fal import FalService
#테스트용
from pydantic import BaseModel

app = FastAPI(title="RealFit AI Server")

human_service = HumanService()
garment_service = GarmentService()
vton_service = VtonService()
fal_service = FalService()

# Nginx와 공유하는 볼륨 경로[cite: 3, 4]
WORKSPACE_DIR = Path("/app/shared/dummy")
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)

# Nginx 정적 파일 제공 URL Prefix (Nginx 설정에 맞춰 /static 으로 서빙됨)
NGINX_STATIC_URL = "/static"

@app.get("/ai/health")
def health_check():
    return {"status": "AI Server is running"}

@app.post("/ai/preprocess/garment")
async def preprocess_garment(file: UploadFile = File(...)):
    """의류 누끼 API"""
    try:
        image_bytes = await file.read()
        processed_bytes = garment_service.remove_background(image_bytes)
        return Response(content=processed_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/preprocess/human")
async def preprocess_human(file: UploadFile = File(...)):
    """마네킹 추출 및 렌더링 API"""
    job_id = str(uuid.uuid4())[:8]
    input_img_path = WORKSPACE_DIR / f"{job_id}_input.png"
    
    try:
        # 1. 파일 저장
        async with aiofiles.open(input_img_path, 'wb') as out_file:
            await out_file.write(await file.read())
            
        # 2. 4D-Humans 추출 (마네킹 .obj 생성)
        obj_path = human_service.extract_3d_mannequin(str(input_img_path), job_id)
        
        # 3. 매쉬 데이터 추출 (후처리용 .json 생성)
        mesh_json_path = human_service.extract_mesh_data(obj_path, job_id)
        
        # 4. PyTorch3D 전면 렌더링 (.png 생성)
        rendered_paths = human_service.render_mannequin_views(obj_path, job_id, vton_target="upper")
        
        # ⭐️ 프론트/백엔드에서 즉시 다운로드할 수 있는 Nginx URL 형식으로 반환
        return JSONResponse(content={
            "status": "success",
            "job_id": job_id,
            "urls": {
                "mannequin_obj": f"{NGINX_STATIC_URL}/{Path(obj_path).name}",
                "mannequin_mesh": f"{NGINX_STATIC_URL}/{Path(mesh_json_path).name}",
                "front_image": f"{NGINX_STATIC_URL}/{Path(rendered_paths['front']).name}"
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Human Processing Error: {str(e)}")
    

# 요청 데이터 구조 정의
class PreprocessRequest(BaseModel):
    front_file_url: str
    cloth_file_url: str
    mannequin_mesh_url: str

@app.post("/ai/preprocess/edit")
async def preprocess_vton(data: PreprocessRequest):
    """옷 합성"""
    try:
        
        # 1단계: vton 합성
        vton_img_path = vton_service.vton(data.front_file_url, data.cloth_file_url)

        # 2단계: 3D 모델 생성
        fal_img_path = fal_service.to3D(vton_img_path)

        # 3단계: 3D 마네킹 보정
        job_id = str(uuid.uuid4())[:8]
        corrected_model_url = human_service.correct_3d_mannequin(
            fal_img_path, 
            data.mannequin_mesh_url, 
            job_id
        )

        return JSONResponse(content={
            "status": "success",
            "job_id": job_id,
            "url": corrected_model_url
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VTON processing failed: {str(e)}")