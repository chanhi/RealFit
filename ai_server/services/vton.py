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
        
        print("🚀 [PROD MODE] fal.ai API를 이용한 Nano-Banana-2 합성을 시작합니다...")
        
        if not human_img_path.exists() or not garment_img_path.exists():
            raise FileNotFoundError("VTON 합성 실패: 이미지를 찾을 수 없습니다.")

        try:
            print("📤 이미지를 fal.ai 서버로 전송 중...")
            human_fal_url = fal_client.upload_file(str(human_img_path))
            garment_fal_url = fal_client.upload_file(str(garment_img_path))

            print("⏳ fal.ai 연산 요청 중 (Nano-Banana-2 Edit)...")
            
            # 🚨 변경점: 새 API 명세에 맞춰 prompt와 image_urls 배열을 사용합니다.
            result = fal_client.run(
                "fal-ai/nano-banana-2/edit",
                arguments={
                    # 옷을 입혀달라는 프롬프트를 지정합니다. (결과에 따라 영어 문구를 조금씩 튜닝하셔도 좋습니다)
                    "prompt": "Make the mannequin wear the garment from the second image. CRITICAL: Strictly preserve the exact original body shape, size, and pose of the mannequin with absolutely zero deformation.", 
                    "image_urls": [human_fal_url, garment_fal_url]
                }
            )
            
            # 새 모델의 응답 구조에 맞춘 이미지 추출 로직 (images 배열 또는 image 객체 대응)
            result_image_url = None
            if 'images' in result and len(result['images']) > 0:
                result_image_url = result['images'][0].get('url')
            elif 'image' in result:
                result_image_url = result['image'].get('url')
            elif 'url' in result: # 간혹 url 자체만 반환하는 경우
                result_image_url = result.get('url')
            
            if not result_image_url:
                raise ValueError(f"API 응답에서 결과를 찾을 수 없습니다. 전체 응답: {result}")

            print(f"📥 연산 완료! 결과 이미지 다운로드 중: {result_image_url}")
            with httpx.Client(timeout=60.0) as client:
                resp = client.get(result_image_url)
                resp.raise_for_status()
                with open(output_img_path, "wb") as f:
                    f.write(resp.content)

            print(f"🎉 성공! 저장 완료: {output_img_path}")
            return str(output_img_path)

        except Exception as e:
            print(f"❌ fal.ai Nano-Banana-2 연산 중 에러 발생: {e}")
            raise e
