import argparse
import torch
from PIL import Image
import os
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
        
        tokenizer_one = AutoTokenizer.from_pretrained(base_path, subfolder="tokenizer", use_fast=False)
        tokenizer_two = AutoTokenizer.from_pretrained(base_path, subfolder="tokenizer_2", use_fast=False)
        noise_scheduler = DDPMScheduler.from_pretrained(base_path, subfolder="scheduler")
        
        text_encoder_one = CLIPTextModel.from_pretrained(base_path, subfolder="text_encoder", torch_dtype=dtype)
        text_encoder_two = CLIPTextModelWithProjection.from_pretrained(base_path, subfolder="text_encoder_2", torch_dtype=dtype)
        image_encoder = CLIPVisionModelWithProjection.from_pretrained(base_path, subfolder="image_encoder", torch_dtype=dtype)
        vae = AutoencoderKL.from_pretrained(base_path, subfolder="vae", torch_dtype=dtype)
        
        UNet_Encoder = UNet2DConditionModel_ref.from_pretrained(base_path, subfolder="unet_encoder", torch_dtype=dtype)
        UNet_Encoder.requires_grad_(False)

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

    except Exception as e:
        print(f"❌ 모델 로드 실패: {e}")
        return

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


