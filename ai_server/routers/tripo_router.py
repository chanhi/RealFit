from fastapi import APIRouter, HTTPException
from schemas.api_models import TripoGenerateRequest, MeshApplyRequest
from services.tripo_service import TripoService # (다음 3단계에서 만들 서비스)
from pathlib import Path

router = APIRouter()
tripo_service = TripoService()

# 1단계: 순수 3D 객체 생성 (외부 API 통신)
@router.post("/generate")
async def generate_3d_model(request: TripoGenerateRequest):
    """1단계: VTON 결과 이미지를 기반으로 Tripo3D를 통해 초기 3D 객체를 생성합니다."""
    try:
        result_path = tripo_service.generate_3d(request.job_id, request.vton_image_url)
        filename = Path(result_path).name
        
        return {
            "status": "success",
            "step": "generation",
            "model_3d_url": f"/static/{filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"3D Generation failed: {str(e)}")

# 2단계: 체형 데이터(Mesh) 반영 (로컬 연산)
@router.post("/apply-mesh")
async def apply_human_mesh(request: MeshApplyRequest):
    """2단계: 생성된 3D 객체에 사용자의 체형(Mesh) 데이터를 로컬에서 반영(Deformation)합니다."""
    try:
        result_path = tripo_service.apply_mesh(
            request.job_id, 
            request.model_3d_url, 
            request.mannequin_mesh_url
        )
        filename = Path(result_path).name
        
        return {
            "status": "success",
            "step": "mesh_applied",
            "final_model_url": f"/static/{filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mesh Application failed: {str(e)}")