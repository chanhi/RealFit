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
