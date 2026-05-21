from pydantic import BaseModel

# 1. 2D VTON 합성 요청 스키마
class VtonRequest(BaseModel):
    front_file_url: str
    cloth_file_url: str

# 2. 3D 모델 생성 요청 스키마 (Tripo3D)
class TripoGenerateRequest(BaseModel):
    job_id: str
    vton_image_url: str

# 3. 3D 매쉬 보정 요청 스키마 (Human Mesh 반영)
class MeshApplyRequest(BaseModel):
    job_id: str
    model_3d_url: str
    mannequin_mesh_url: str