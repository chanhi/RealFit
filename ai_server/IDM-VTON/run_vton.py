import os
import uuid
import shutil
import httpx
from pathlib import Path
import fal_client
from dotenv import load_dotenv

# .env 파일에서 FAL_KEY 로드
load_dotenv()

class VtonService:
    def __init__(self):
        # 로컬 테스트 환경을 고려하여 현재 작업 디렉토리 기준으로 dummy 폴더 지정
        # (만약 에러가 난다면 절대경로로 수정하셔도 됩니다)
        self.base_path = Path.cwd() 
        self.workspace_dir = self.base_path / "shared" / "dummy"
        
        # dummy 폴더가 없으면 자동 생성 (로컬 테스트용)
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        
        self.mode = os.getenv("AI_MODE", "test").lower()

    def vton(self, front_file_url: str, cloth_file_url: str) -> str:
        # 1. URL에서 파일명만 추출하여 로컬(dummy) 내의 파일 절대 경로 매핑
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
            dummy_source = self.workspace_dir / "vton_result.png"
            
            if dummy_source.exists():
                shutil.copy(dummy_source, output_img_path)
            else:
                shutil.copy(human_img_path, output_img_path)
            return str(output_img_path)
        
        # ==========================================
        # 🔴 [PROD MODE] fal.ai API를 통한 초고속 IDM-VTON 연산
        # ==========================================
        print("🚀 [PROD MODE] fal.ai API를 이용한 실제 IDM-VTON 합성을 시작합니다...")
        
        if not human_img_path.exists() or not garment_img_path.exists():
            raise FileNotFoundError(f"VTON 합성 실패: 로컬 dummy 폴더에 이미지를 찾을 수 없습니다. ({front_filename}, {cloth_filename})")

        try:
            # [핵심 1] 로컬 PC의 이미지를 fal.ai가 접근할 수 있도록 임시 클라우드에 업로드
            print("📤 이미지를 fal.ai 서버로 전송 중...")
            human_fal_url = fal_client.upload_file(str(human_img_path))
            garment_fal_url = fal_client.upload_file(str(garment_img_path))

            # [핵심 2] fal.ai IDM-VTON API 호출 (모든 전처리 자동 수행)
            print("⏳ fal.ai 연산 요청 중 (약 3~5초 소요)...")
            result = fal_client.subscribe(
                "fal-ai/idm-vton",
                arguments={
                    "human_image_url": human_fal_url,
                    "garment_image_url": garment_fal_url,
                    "description": "A photorealistic high-quality photo of a model wearing the target garment",
                    "num_inference_steps": 30,
                    "guidance_scale": 2.0
                },
                with_logs=True
            )
            
            result_image_url = result['image']['url']
            print(f"📥 연산 완료! 결과 이미지 다운로드 중: {result_image_url}")

            # [핵심 3] 결과 URL의 이미지를 다시 내 로컬 dummy 폴더로 다운로드
            with httpx.Client(timeout=60.0) as client:
                resp = client.get(result_image_url)
                resp.raise_for_status()
                with open(output_img_path, "wb") as f:
                    f.write(resp.content)

            print(f"🎉 성공! 로컬에 저장 완료: {output_img_path}")
            
            # 기존 로직과 동일하게 생성된 파일의 절대 경로를 반환 (Router에서 /static/ URL로 변환됨)
            return str(output_img_path)

        except Exception as e:
            print(f"❌ fal.ai VTON 연산 중 에러 발생: {e}")
            raise e