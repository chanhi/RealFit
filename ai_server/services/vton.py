import uuid
import subprocess
from pathlib import Path

class VtonService:
    def __init__(self):
        self.base_path = Path("/app")
        # Nginx 공유 볼륨 경로
        self.workspace_dir = self.base_path / "shared" / "dummy"
        # IDM-VTON 스크립트가 위치할 경로
        self.vton_dir = self.base_path / "IDM-VTON"

    def vton(self, front_file_url: str, cloth_file_url: str) -> str:
        """vton 합성 (더미 -> 실제 스크립트 호출로 변경)"""
        
        # 1. URL(/static/...)에서 파일명만 추출
        front_filename = front_file_url.split("/")[-1]
        cloth_filename = cloth_file_url.split("/")[-1]
        
        human_img_path = self.workspace_dir / front_filename
        garment_img_path = self.workspace_dir / cloth_filename
        
        if not human_img_path.exists() or not garment_img_path.exists():
            raise FileNotFoundError(f"VTON 합성 실패: 이미지를 찾을 수 없습니다. ({front_filename}, {cloth_filename})")

        # 2. 결과물 저장 경로 생성
        job_id = str(uuid.uuid4())[:8]
        output_img_path = self.workspace_dir / f"{job_id}_vton_result.png"
        script_path = self.vton_dir / "run_vton.py"
        
        # 3. 파이썬 스크립트 실행 (run_vton.py)
        command = [
            "python", str(script_path),
            "--human", str(human_img_path),
            "--garment", str(garment_img_path),
            "--out", str(output_img_path)
        ]
        
        print(f"실행 명령어: {' '.join(command)}")
        
        # 스크립트가 에러를 뱉으면 FastAPI 쪽으로 에러를 던짐 (check=True)
        subprocess.run(command, check=True, cwd=str(self.vton_dir))
        
        # 2단계(fal_service.to3D)로 넘겨주기 위한 로컬 절대 경로 반환
        return str(output_img_path)