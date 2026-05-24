from fastapi import APIRouter, HTTPException
from schemas.api_models import VtonRequest
from services.vton import VtonService
from pathlib import Path

router = APIRouter()
vton_service = VtonService()

@router.post("")
async def generate_vton(request: VtonRequest):
    """사용자 마네킹과 누끼 의류를 합성하여 2D VTON 결과를 반환합니다."""
    try:
        # 서비스 계층 호출 (테스트 모드일 경우 1초 만에 더미 반환)
        result_path = vton_service.vton(request.front_file_url, request.cloth_file_url)
        
        # 로컬 절대 경로를 Nginx 정적 URL로 변환
        filename = Path(result_path).name
        
        return {
            "status": "success",
            "url": f"/static/{filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VTON processing failed: {str(e)}")