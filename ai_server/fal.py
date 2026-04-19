import fal_client
from dotenv import load_dotenv

# 1. API 키 설정
load_dotenv()

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

def to3D(input_url):
    
    url = fal_client.upload_file(input_url)

    result = fal_client.subscribe(
        "tripo3d/tripo/v2.5/image-to-3d",
        arguments={
            "texture": "standard",
            "texture_alignment": "original_image",
            "orientation": "default",
            "image_url": url
        },
        with_logs=True,
        on_queue_update=on_queue_update,
    )

    model_mesh_url = result["model_mesh"]["url"]
    rendered_image_url = result["rendered_image"]["url"]
    
    return result
