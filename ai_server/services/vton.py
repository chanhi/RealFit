import os
import uuid
import subprocess
import shutil
from pathlib import Path

class VtonService:
    def __init__(self):
        self.base_path = Path("/app")
        # Nginx 공유 볼륨 경로
        self.workspace_dir = self.base_path / "shared" / "dummy"
        # IDM-VTON 스크립트가 위치할 경로
        self.vton_dir = self.base_path / "IDM-VTON"
        # 환경 변수 읽기 (기본값은 test)
        self.mode = os.getenv("AI_MODE", "test").lower()

    def vton(self, front_file_url: str, cloth_file_url: str) -> str:
        # URL(/static/...)에서 파일명만 추출
        front_filename = front_file_url.split("/")[-1]
        cloth_filename = cloth_file_url.split("/")[-1]
        
        human_img_path = self.workspace_dir / front_filename
        garment_img_path = self.workspace_dir / cloth_filename

        job_id = str(uuid.uuid4())[:8]
        output_img_path = self.workspace_dir / f"{job_id}_vton_result.png"

        # ==========================================
        # [TEST MODE] 고속 더미 반환 모드
        # ==========================================
        if self.mode == "test":
            print("⚡ [TEST MODE] AI 연산을 건너뛰고 더미 결과를 즉시 반환합니다.")
            dummy_source = self.workspace_dir / "vton_result.png" # 미리 넣어둔 더미 파일
            
            if dummy_source.exists():
                # 더미 결과본이 있다면 그걸 복사해서 응답
                shutil.copy(dummy_source, output_img_path)
            else:
                # 더미가 없다면 에러 방지를 위해 원본 사람 이미지를 그대로 반환
                print("⚠️ 경고: 더미 파일(vton_result.png)이 없어 원본을 대신 반환합니다.")
                shutil.copy(human_img_path, output_img_path)
                
            return str(output_img_path)
        
        # ==========================================
        # 🔴 [PROD MODE] 실제 IDM-VTON 모델 연산
        # ==========================================
        print("🚀 [PROD MODE] 실제 IDM-VTON 합성을 시작합니다...")
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
        
        # PYTHONPATH 환경변수에 IDM-VTON 경로 추가하여 모듈 탐색이 가능하도록 보강
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{self.vton_dir}:{env.get('PYTHONPATH', '')}"
        
        # 스크립트가 에러를 뱉으면 FastAPI 쪽으로 에러를 던짐 (check=True)
        subprocess.run(command, check=True, cwd=str(self.vton_dir), env=env)
        
        # 2단계(fal_service.to3D)로 넘겨주기 위한 로컬 절대 경로 반환
        return str(output_img_path)