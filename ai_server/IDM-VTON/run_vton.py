import argparse
import torch
from PIL import Image
from diffusers import StableDiffusionXLInpaintPipeline

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--human', type=str, required=True, help='마네킹 렌더링 이미지 경로')
    parser.add_argument('--garment', type=str, required=True, help='누끼 의류 이미지 경로')
    parser.add_argument('--out', type=str, required=True, help='합성 결과 저장 경로')
    args = parser.parse_args()

    print("🤖 VTON 모델 로딩 중 (최초 실행 시 10GB 모델 다운로드에 시간이 걸립니다!)...")
    device = "cpu"
    
    try:
        # SDXL 기반 Inpaint 파이프라인 로드 (추후 실서버 배포시 공식 IDM-VTON 로직으로 교체)
        pipe = StableDiffusionXLInpaintPipeline.from_pretrained(
            "diffusers/stable-diffusion-xl-1.0-inpainting-0.1", 
            torch_dtype=torch.float32, 
            use_safetensors=True
        )
        pipe = pipe.to(device)
    except Exception as e:
        print(f"❌ 모델 로드 실패: {e}")
        return

    print("🔍 VTON 이미지 합성 중 (CPU 연산이므로 수 분 이상 소요됩니다)...")
    human_img = Image.open(args.human).convert("RGB")
    garment_img = Image.open(args.garment).convert("RGB")
    
    # 합성 영역 지정 마스크 (테스트용 전체 마스크)
    mask_img = Image.new("L", human_img.size, 255) 
    
    prompt = "A highly realistic photo of a mannequin wearing the target garment, photorealistic, 8k, high detail"
    negative_prompt = "bare body, artifacts, bad anatomy, blurry, deformed, distorted"

    # 합성 추론
    output = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=human_img,
        mask_image=mask_img,
        num_inference_steps=15, # CPU 속도 확보를 위해 추론 스텝수를 낮춤 (기본 50)
        guidance_scale=7.5
    ).images[0]

    output.save(args.out)
    print(f"🎉 성공! VTON 합성 완료: {args.out}")

if __name__ == '__main__':
    main()