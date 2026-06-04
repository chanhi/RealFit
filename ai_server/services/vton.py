import os
import uuid
import shutil
import httpx
from pathlib import Path
import fal_client
from dotenv import load_dotenv

load_dotenv()

class VtonService:
    def __init__(self):
        self.base_path = Path("/app")
        self.workspace_dir = self.base_path / "shared" / "dummy"
        self.mode = os.getenv("AI_MODE", "prod").lower()

    def vton(self, front_file_url: str, cloth_file_url: str) -> str:
        front_filename = front_file_url.split("/")[-1]
        cloth_filename = cloth_file_url.split("/")[-1]
        
        human_img_path = self.workspace_dir / front_filename
        garment_img_path = self.workspace_dir / cloth_filename
        output_img_path = self.workspace_dir / f"{str(uuid.uuid4())[:8]}_vton_result.png"

        if self.mode == "test":
            print("⚡ [TEST MODE] AI 연산을 건너뛰고 더미 결과를 즉시 반환합니다.")
            dummy_source = self.workspace_dir / "vton_result.png"
            if dummy_source.exists(): shutil.copy(dummy_source, output_img_path)
            else: shutil.copy(human_img_path, output_img_path)
            return str(output_img_path)
        
        print("🚀 [PROD MODE] fal.ai API를 이용한 Cat-VTON 합성을 시작합니다...")
        
        if not human_img_path.exists() or not garment_img_path.exists():
            raise FileNotFoundError("VTON 합성 실패: 이미지를 찾을 수 없습니다.")

        try:
            print("📤 이미지를 fal.ai 서버로 전송 중...")
            human_fal_url = fal_client.upload_file(str(human_img_path))
            garment_fal_url = fal_client.upload_file(str(garment_img_path))

            print("⏳ fal.ai 연산 요청 중 (Cat-VTON)...")
            # subscribe 대신 모든 버전에서 호환되는 강력한 run 메서드를 사용합니다.
            result = fal_client.run(
                "fal-ai/cat-vton",
                arguments={
                    "human_image_url": human_fal_url,
                    "garment_image_url": garment_fal_url,
                    "cloth_type": "upper"  # 상의(upper), 하의(lower), 전신(overall)
                }
            )
            
            # Cat-VTON API의 응답 구조에서 이미지 URL 추출
            result_image_url = result.get('image', {}).get('url') 
            
            if not result_image_url:
                raise ValueError(f"API 응답에서 결과를 찾을 수 없습니다. 전체 응답: {result}")

            print(f"📥 연산 완료! 결과 이미지 다운로드 중...")
            with httpx.Client(timeout=60.0) as client:
                resp = client.get(result_image_url)
                resp.raise_for_status()
                with open(output_img_path, "wb") as f:
                    f.write(resp.content)

            print(f"🎉 성공! 저장 완료: {output_img_path}")
            return str(output_img_path)

        except Exception as e:
            print(f"❌ fal.ai Cat-VTON 연산 중 에러 발생: {e}")
            raise e