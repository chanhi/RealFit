import io
import os
import uuid
from pathlib import Path
from PIL import Image
from rembg import remove

class GarmentService:
    def __init__(self):
        self.workspace_dir = Path("/app/shared/dummy")
        self.mode = os.getenv("AI_MODE", "test").lower()

    @staticmethod
    def remove_background(image_bytes: bytes) -> bytes:
        """Colab Cell 5: 의류 배경 제거(누끼) 핵심 로직"""
        input_img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        output_img = remove(input_img)
        
        img_byte_arr = io.BytesIO()
        output_img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()

    def process(self, image_url: str) -> dict:
        """라우터에서 호출하는 의류 누끼 처리 진입점"""
        # 🟢 [TEST MODE] 누끼 연산 생략
        if self.mode == "test":
            print("⚡ [TEST MODE] 의류 누끼 처리를 건너뛰고 원본을 그대로 반환합니다.")
            return {"cloth_nobg_url": image_url}

        # 🔴 [PROD MODE] 실제 AI 배경 제거
        print("🚀 [PROD MODE] 의류 배경 제거(누끼)를 시작합니다...")
        filename = image_url.split("/")[-1]
        local_image_path = self.workspace_dir / filename

        if not local_image_path.exists():
            raise FileNotFoundError(f"의류 이미지를 찾을 수 없습니다: {filename}")

        # 로컬 파일 읽기
        with open(local_image_path, "rb") as f:
            image_bytes = f.read()

        # 누끼 추출
        output_bytes = self.remove_background(image_bytes)

        # 고유 이름으로 저장
        job_id = str(uuid.uuid4())[:8]
        output_filename = f"{job_id}_cloth_nobg.png"
        output_path = self.workspace_dir / output_filename

        with open(output_path, "wb") as f:
            f.write(output_bytes)

        return {
            "cloth_nobg_url": f"/static/{output_filename}"
        }