import fal_client
from dotenv import load_dotenv

class FalService:
    # 1. API 키 설정
    load_dotenv()

    def on_queue_update(self, update):
        if isinstance(update, fal_client.InProgress):
            for log in update.logs:
                print(log["message"])

    def to3D(self, input_url):
        
        # url = fal_client.upload_file(input_url)

        # result = fal_client.subscribe(
        #     "tripo3d/tripo/v2.5/image-to-3d",
        #     arguments={
        #         "texture": "standard",
        #         "texture_alignment": "original_image",
        #         "orientation": "default",
        #         "image_url": url
        #     },
        #     with_logs=True,
        #     on_queue_update=on_queue_update,
        # )

        # model_mesh_url = result["model_mesh"]["url"]
        # rendered_image_url = result["rendered_image"]["url"]
        dummy_image_url = "https://v3b.fal.media/files/b/0a9651dc/LX8gVO2oRa46wuBZPMqfl_tripo_model_5fe29ede-6d72-4ba3-9aef-0009414c6323.glb"
        
        return dummy_image_url

    def generate_3d_model(self, public_image_url: str, output_path: str) -> str:
        """
        Generates a 3D model (GLB) from a 2D image url using Tripo3D via Fal.ai
        and saves it to the specified output path.
        """
        import httpx
        import os

        # Check if FAL_KEY is configured
        fal_key = os.getenv("FAL_KEY")
        
        if not fal_key:
            print("⚠️ FAL_KEY가 설정되어 있지 않습니다. 더미 GLB 다운로드로 대체합니다.")
            dummy_url = self.to3D(public_image_url)
            self._download_file(dummy_url, output_path)
            return output_path

        try:
            print(f"📡 Tripo3D API 호출 시작: {public_image_url}")
            result = fal_client.subscribe(
                "tripo3d/tripo/v2.5/image-to-3d",
                arguments={
                    "texture": "standard",
                    "texture_alignment": "original_image",
                    "orientation": "default",
                    "image_url": public_image_url
                },
                with_logs=True,
                on_queue_update=self.on_queue_update,
            )
            
            glb_url = result["model_mesh"]["url"]
            print(f"📥 3D 모델 생성 완료! GLB 다운로드 중: {glb_url}")
            self._download_file(glb_url, output_path)
            return output_path
            
        except Exception as e:
            print(f"❌ Tripo3D API 호출 또는 다운로드 중 에러 발생: {e}")
            print("⚠️ 에러 완화를 위해 백업 더미 GLB 다운로드로 대체합니다.")
            dummy_url = self.to3D(public_image_url)
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

