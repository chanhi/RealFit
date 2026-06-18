# ai_server/services/fal.py

import fal_client
from dotenv import load_dotenv
import os

class FalService:
    # 1. API 키 설정
    load_dotenv()

    def on_queue_update(self, update):
        if isinstance(update, fal_client.InProgress):
            for log in update.logs:
                print(log["message"])

    def to3D(self, input_url):
        dummy_image_url = "https://v3b.fal.media/files/b/0a9651dc/LX8gVO2oRa46wuBZPMqfl_tripo_model_5fe29ede-6d72-4ba3-9aef-0009414c6323.glb"
        return dummy_image_url

    def generate_3d_model(self, local_image_path: str, output_path: str) -> str:
        """
        Generates a 3D model (GLB) from a 2D image using Tripo3D via Fal.ai
        and saves it to the specified output path.
        """
        import httpx

        # Check if FAL_KEY is configured
        fal_key = os.getenv("FAL_KEY")
        
        if not fal_key:
            print("⚠️ FAL_KEY가 설정되어 있지 않습니다. 더미 GLB 다운로드로 대체합니다.")
            dummy_url = self.to3D(local_image_path)
            self._download_file(dummy_url, output_path)
            return output_path

        try:
            print(f"📡 Tripo3D API 호출 시작 (이미지 업로드 중): {local_image_path}")
            
            # [추가된 로직] 로컬 파일을 fal.media CDN에 업로드하여 외부에서 접근 가능한 URL을 획득합니다.
            uploaded_url = fal_client.upload_file(local_image_path)
            print(f"🌐 이미지 업로드 성공: {uploaded_url}")

            # [수정된 로직] fal_client 0.3.0 버전 문법에 맞춰 subscribe 대신 submit을 사용합니다.
            handler = fal_client.submit(
                "tripo3d/tripo/v2.5/image-to-3d",
                arguments={
                    "texture": "standard",
                    "texture_alignment": "original_image",
                    "orientation": "default",
                    "image_url": uploaded_url
                }
            )
            
            # 진행 상태 로그 스트리밍 (0.3.0 버전 iter_events 패턴)
            for event in handler.iter_events(with_logs=True):
                self.on_queue_update(event)
            
            # 연산 완료 대기 후 결과 가져오기
            result = handler.get()
            
            glb_url = result["model_mesh"]["url"]
            print(f"📥 3D 모델 생성 완료! GLB 다운로드 중: {glb_url}")
            self._download_file(glb_url, output_path)
            return output_path
            
        except Exception as e:
            print(f"❌ Tripo3D API 호출 또는 다운로드 중 에러 발생: {e}")
            print("⚠️ 에러 완화를 위해 백업 더미 GLB 다운로드로 대체합니다.")
            dummy_url = self.to3D(local_image_path)
            self._download_file(dummy_url, output_path)
            return output_path

    def _download_file(self, url: str, dest_path: str):
        import httpx
        with httpx.Client(timeout=120.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            with open(dest_path, "wb") as f:
                f.write(resp.content)
        print(f"💾 GLB 파일 다운로드 완료 및 저장됨: {dest_path}")
