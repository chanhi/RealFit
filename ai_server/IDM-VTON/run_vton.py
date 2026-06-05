import os
<<<<<<< HEAD
from torchvision import transforms

try:
    from diffusers import DDPMScheduler, AutoencoderKL
    from transformers import (
        CLIPImageProcessor, 
        CLIPVisionModelWithProjection, 
        CLIPTextModel, 
        CLIPTextModelWithProjection, 
        AutoTokenizer
    )
    from src.unet_hacked_garmnet import UNet2DConditionModel as UNet2DConditionModel_ref
    from src.unet_hacked_tryon import UNet2DConditionModel
    from src.tryon_pipeline import StableDiffusionXLInpaintPipeline as TryonPipeline
except ImportError as e:
    print(f"❌ IDM-VTON 공식 모듈을 찾을 수 없습니다: {e}")
    import sys
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--human', type=str, required=True)
    parser.add_argument('--garment', type=str, required=True)
    parser.add_argument('--out', type=str, required=True)
    args = parser.parse_args()

    print("🤖 [PROD] 실제 IDM-VTON 프로덕션 모델 로딩 중 (약 16GB)...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    base_path = "yisol/IDM-VTON"

    try:
        unet = UNet2DConditionModel.from_pretrained(base_path, subfolder="unet", torch_dtype=dtype)
        unet.requires_grad_(False)
=======
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
>>>>>>> abf79454360043773c89e707d7e7ae43b0d0021c
        
        # dummy 폴더가 없으면 자동 생성 (로컬 테스트용)
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        
        self.mode = os.getenv("AI_MODE", "test").lower()

    def vton(self, front_file_url: str, cloth_file_url: str) -> str:
        # 1. URL에서 파일명만 추출하여 로컬(dummy) 내의 파일 절대 경로 매핑
        front_filename = front_file_url.split("/")[-1]
        cloth_filename = cloth_file_url.split("/")[-1]
        
        human_img_path = self.workspace_dir / front_filename
        garment_img_path = self.workspace_dir / cloth_filename

<<<<<<< HEAD
        pipe = TryonPipeline.from_pretrained(
            base_path,
            unet=unet,
            vae=vae,
            feature_extractor=CLIPImageProcessor(),
            text_encoder=text_encoder_one,
            text_encoder_2=text_encoder_two,
            tokenizer=tokenizer_one,
            tokenizer_2=tokenizer_two,
            scheduler=noise_scheduler,
            image_encoder=image_encoder,
            torch_dtype=dtype,
        )
        pipe.unet_encoder = UNet_Encoder
        pipe = pipe.to(device)
=======
        job_id = str(uuid.uuid4())[:8]
        output_img_path = self.workspace_dir / f"{job_id}_vton_result.png"
>>>>>>> abf79454360043773c89e707d7e7ae43b0d0021c

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

<<<<<<< HEAD
    print(f"🔍 실제 IDM-VTON 이미지 합성 중 ({device.upper()} 가속)...")
    human_img = Image.open(args.human).convert("RGB")
    garment_img = Image.open(args.garment).convert("RGB")
    
    target_size = (768, 1024)
    human_img = human_img.resize(target_size)
    garment_img = garment_img.resize(target_size)
    
    mask_img = Image.new("L", target_size, 255)
    pose_img_pil = Image.new("RGB", target_size, (0, 0, 0))

    tensor_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize([0.5], [0.5]),
    ])
    
    pose_tensor = tensor_transform(pose_img_pil).unsqueeze(0).to(device, dtype=dtype)
    garment_tensor = tensor_transform(garment_img).unsqueeze(0).to(device, dtype=dtype)

    garment_des = "a piece of clothing"
    prompt = "model is wearing " + garment_des
    negative_prompt = "bare body, artifacts, bad anatomy, blurry, deformed, distorted, lowres, ugly"

    with torch.inference_mode():
        (
            prompt_embeds,
            negative_prompt_embeds,
            pooled_prompt_embeds,
            negative_pooled_prompt_embeds,
        ) = pipe.encode_prompt(
            prompt,
            num_images_per_prompt=1,
            do_classifier_free_guidance=True,
            negative_prompt=negative_prompt,
        )
        
        prompt_embeds_c, _, _, _ = pipe.encode_prompt(
            garment_des,
            num_images_per_prompt=1,
            do_classifier_free_guidance=False,
            negative_prompt=negative_prompt,
        )

        # 🚨 [수정] .images[0]을 없애고 순수 결과물 전체를 받음
        result = pipe(
            prompt_embeds=prompt_embeds,
            negative_prompt_embeds=negative_prompt_embeds,
            pooled_prompt_embeds=pooled_prompt_embeds,
            negative_pooled_prompt_embeds=negative_pooled_prompt_embeds,
            image=human_img,
            mask_image=mask_img,
            ip_adapter_image=garment_img, 
            cloth=garment_tensor,         
            pose_img=pose_tensor,         
            text_embeds_cloth=prompt_embeds_c,
            height=1024,
            width=768,
            num_inference_steps=30,
            guidance_scale=2.0
        )

        # 🚨 [해결] 튜플, 리스트 등 어떤 포장지로 와도 이미지를 강제로 꺼내는 마법의 코드
        if hasattr(result, 'images'):
            final_img = result.images[0]
        elif isinstance(result, tuple):
            final_img = result[0][0] if isinstance(result[0], list) else result[0]
        else:
            final_img = result[0]

    final_img.save(args.out)
    print(f"🎉 성공! 실제 IDM-VTON 합성 완료: {args.out}")

if __name__ == '__main__':
    main()


=======
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
>>>>>>> abf79454360043773c89e707d7e7ae43b0d0021c
