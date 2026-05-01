import io
from PIL import Image
from rembg import remove

class GarmentService:
    @staticmethod
    def remove_background(image_bytes: bytes) -> bytes:
        """Colab Cell 5: 의류 배경 제거(누끼)"""
        input_img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        output_img = remove(input_img)
        
        img_byte_arr = io.BytesIO()
        output_img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()