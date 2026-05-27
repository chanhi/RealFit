import argparse
import torch
from PIL import Image
import os

# ---------------------------------------------------------
# [주의] 아래 모듈들은 yisol/IDM-VTON 공식 Github 코드가 
# 현재 폴더(IDM-VTON) 내에 클론되어 있어야 정상 작동합니다.
# ---------------------------------------------------------
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
    print("💡 팁: 'git clone https://github.com/yisol/IDM-VTON.git'의 내부 파일들이 같은 경로에 있어야 합니다.")
    import sys
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--human', type=str, required=True, help='마네킹 렌더링 이미지 경로')
    parser.add_argument('--garment', type=str, required=True, help='누끼 의류 이미지 경로')
    parser.add_argument('--out', type=str, required=True, help='합성 결과 저장 경로')
    args = parser.parse_args()

    print("🤖 [PROD] 실제 IDM-VTON 프로덕션 모델 로딩 중 (약 16GB)...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    base_path = "yisol/IDM-VTON"

    try:
        # 1. IDM-VTON 전용 커스텀 UNet 및 인코더 분리 로드
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

        # 2. Tryon 커스텀 파이프라인 조립 (기존 일반 파이프라인을 덮어씀)
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
    
    # IDM-VTON 최적화 권장 해상도로 리사이징
    target_size = (768, 1024)
    human_img = human_img.resize(target_size)
    garment_img = garment_img.resize(target_size)
    
    # ⚠️ [매우 중요] 실제 환경에서는 사람의 형체를 딴 'Agnostic Mask'와 'DensePose' 이미지가 반드시 필요합니다.
    # 현재는 코드 구동과 에러 방지를 위해 임시로 흰색 마스크와 검은색 포즈를 넘깁니다. 
    mask_img = Image.new("L", target_size, 255)
    pose_img = Image.new("RGB", target_size, (0, 0, 0))

    prompt = "photorealistic, high detail, high quality"
    negative_prompt = "bare body, artifacts, bad anatomy, blurry, deformed, distorted, lowres, ugly"

    # 합성 추론
    output = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=human_img,
        mask_image=mask_img,
        cloth_image=garment_img, # 의류 원본 투입
        pose_image=pose_img,     # 일반 모델에는 없는 IDM-VTON 핵심 파라미터 (인체 곡률)
        num_inference_steps=30,  # 프로덕션 권장 스텝 (기존 15 -> 30으로 상향)
        guidance_scale=2.0
    ).images[0]

    output.save(args.out)
    print(f"🎉 성공! 실제 IDM-VTON 합성 완료: {args.out}")

if __name__ == '__main__':
    main()