from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.human_service import HumanService
from services.garment_service import GarmentService

router = APIRouter()
human_service = HumanService()
garment_service = GarmentService()

# 간단한 전처리용 임시 스키마
class PreprocessRequest(BaseModel):
    image_url: str

@router.post("/human")
async def preprocess_human(request: PreprocessRequest):
    """사용자 전신 이미지를 받아 마네킹 이미지와 매쉬(Mesh) 데이터를 추출합니다."""
    try:
        # 기존 HumanService 로직 호출
        result = human_service.process(request.image_url)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Human preprocess failed: {str(e)}")

@router.post("/garment")
async def preprocess_garment(request: PreprocessRequest):
    """의류 이미지를 받아 누끼(배경 제거) 처리를 진행합니다."""
    try:
        # 기존 GarmentService 로직 호출
        result = garment_service.process(request.image_url)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Garment preprocess failed: {str(e)}")