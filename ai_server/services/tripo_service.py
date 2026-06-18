import os
import shutil
from pathlib import Path

# 기존 팀원분이 작성하신 외부 API 통신 모듈을 임포트합니다.
from services.fal import FalService 

class TripoService:
    def __init__(self):
        self.base_path = Path("/app")
        self.workspace_dir = self.base_path / "shared" / "dummy"
        self.fal_service = FalService()
        self.mode = os.getenv("AI_MODE", "test").lower()

    def generate_3d(self, job_id: str, vton_image_url: str) -> str:
        """
        1단계: VTON 결과 이미지를 기반으로 3D 모델(GLB)을 생성합니다.
        테스트 모드일 경우 미리 준비된 더미 GLB를 반환합니다.
        """
        output_glb_path = self.workspace_dir / f"{job_id}_tripo_result.glb"

        # ==========================================
        # 🟢 [TEST MODE] API 통신 생략 & 더미 3D 반환
        # ==========================================
        if self.mode == "test":
            print("⚡ [TEST MODE] Tripo3D API 호출을 건너뛰고 더미 결과를 반환합니다.")
            dummy_glb_path = self.workspace_dir / "result.glb" # 기존 dummy 폴더의 파일
            
            if dummy_glb_path.exists():
                shutil.copy(dummy_glb_path, output_glb_path)
                return str(output_glb_path)
            else:
                # 더미가 없을 경우 예외 처리 (빈 파일 생성 방지)
                print("❌ 에러: 더미 파일(result.glb)이 워크스페이스에 존재하지 않습니다.")
                raise FileNotFoundError("테스트용 result.glb 파일이 없어 3D 생성을 진행할 수 없습니다.")

        # ==========================================
        # 🔴 [PROD MODE] 실제 FAL(Tripo3D) API 호출
        # ==========================================
        print("🚀 [PROD MODE] 실제 3D 모델 생성을 시작합니다...")
        
        image_filename = vton_image_url.split("/")[-1]
        local_image_path = self.workspace_dir / image_filename

        if not local_image_path.exists():
            raise FileNotFoundError(f"3D 생성 실패: 원본 이미지를 찾을 수 없습니다. ({image_filename})")

        try:
            # 내부 Nginx URL 대신 로컬 파일의 절대 경로를 전달 (FalService에서 업로드 수행)
            result_path = self.fal_service.generate_3d_model(str(local_image_path), str(output_glb_path))
            return result_path
        except Exception as e:
            print(f"❌ 3D 생성 API 호출 실패: {e}")
            raise e

    def apply_mesh(self, job_id: str, model_3d_url: str, mannequin_mesh_url: str) -> str:
        """
        2단계: 생성된 3D 객체에 사용자의 체형(Mesh) 데이터를 로컬 연산으로 반영합니다.
        """
        output_final_path = self.workspace_dir / f"{job_id}_final_mesh.glb"

        # ==========================================
        # 🟢 [TEST MODE] 매쉬 보정 연산 생략
        # ==========================================
        if self.mode == "test":
            print("⚡ [TEST MODE] 3D 매쉬 보정 연산을 건너뛰고 원본 모델을 그대로 반환합니다.")
            
            model_filename = model_3d_url.split("/")[-1]
            input_glb_path = self.workspace_dir / model_filename
            
            if input_glb_path.exists():
                shutil.copy(input_glb_path, output_final_path)
            else:
                output_final_path.touch()
                
            return str(output_final_path)

        # ==========================================
        # 🔴 [PROD MODE] 실제 3D Mesh Deformation 알고리즘 실행
        # ==========================================
        print("🚀 [PROD MODE] 3D 매쉬 보정 알고리즘을 적용합니다...")
        
        model_filename = model_3d_url.split("/")[-1]
        mesh_filename = mannequin_mesh_url.split("/")[-1]
        
        local_model_path = self.workspace_dir / model_filename
        local_mesh_path = self.workspace_dir / mesh_filename
        
        if not local_model_path.exists() or not local_mesh_path.exists():
            raise FileNotFoundError("매쉬 보정 실패: 3D 모델 또는 매쉬 데이터 파일을 찾을 수 없습니다.")

        # [TODO: 팀원분이 작성할 실제 3D 정점(Vertex) 변형 알고리즘 삽입 위치]
        # 예: trimesh, open3d 등의 라이브러리를 활용하여 두 데이터를 병합
        
        # 현재는 아키텍처 뼈대 완성을 위해 입력된 모델을 복사하여 리턴합니다.
        shutil.copy(local_model_path, output_final_path)
        
        return str(output_final_path)
