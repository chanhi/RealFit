"""
ai_server/fal_extended.py  (신규 추가 — 기존 fal.py 변경 없음)
────────────────────────────────────────────────────────────────
기존 fal.py 의 to3D() 를 import 하고,
마네킹 적용 단계를 연결하는 full_pipeline() 을 제공합니다.
"""

import os
import httpx
from dotenv import load_dotenv

# 기존 fal.py 그대로 재사용
from fal import to3D  # noqa: F401 (기존 fal.py, 변경 없음)

load_dotenv()

AI_SERVER_URL = os.getenv("AI_SERVER_URL", "http://ai_server:9002")


def apply_to_mannequin(
    tripo_glb_url: str,
    job_id: str,
    garment_region: str = "upper",
    drape_offset: float = 0.012,
    timeout: int = 300,
) -> dict:
    """
    Tripo3D GLB URL을 /ai/apply-garment 에 전달합니다.

    Returns
    -------
    {
      "status": "success",
      "job_id": "...",
      "urls": {
        "draped_glb": "/static/..._garment_draped.glb",
        "merged_glb": "/static/..._merged.glb",
        "mesh_json":  "/static/..._garment_mesh.json"
      }
    }
    """
    payload = {
        "tripo_glb_url":  tripo_glb_url,
        "job_id":         job_id,
        "garment_region": garment_region,
        "drape_offset":   str(drape_offset),
    }
    with httpx.Client(timeout=timeout) as c:
        r = c.post(f"{AI_SERVER_URL}/ai/apply-garment", data=payload)
        r.raise_for_status()

    result = r.json()
    print(f"✅ 마네킹 적용 완료: {result['urls']['merged_glb']}")
    return result


def full_pipeline(
    garment_image_path: str,
    mannequin_job_id: str,
    garment_region: str = "upper",
    drape_offset: float = 0.012,
) -> dict:
    """
    의류 이미지 → Tripo3D → 마네킹 적용 전체 파이프라인.

    Parameters
    ----------
    garment_image_path : 의류 이미지 로컬 경로 (배경 제거 PNG 권장)
    mannequin_job_id   : /ai/preprocess/human 에서 받은 job_id
    garment_region     : "upper" | "lower" | "full"
    drape_offset       : 드레이프 오프셋 (m)
    """
    print(f"🚀 [1/2] Tripo3D 모델 생성 중... ({garment_image_path})")
    tripo_result = to3D(garment_image_path)
    glb_url = tripo_result["model_mesh"]["url"]

    print(f"🚀 [2/2] 마네킹에 의류 적용 중... (job_id={mannequin_job_id})")
    apply_result = apply_to_mannequin(
        tripo_glb_url=glb_url,
        job_id=mannequin_job_id,
        garment_region=garment_region,
        drape_offset=drape_offset,
    )

    print("\n🎉 완료!")
    print(f"   드레이프 GLB : {apply_result['urls']['draped_glb']}")
    print(f"   합성 GLB     : {apply_result['urls']['merged_glb']}")
    print(f"   메쉬 JSON    : {apply_result['urls']['mesh_json']}")

    return {"tripo_result": tripo_result, "apply_result": apply_result}


# ── CLI 테스트 ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--garment", required=True, help="의류 이미지 경로")
    parser.add_argument("--job-id",  required=True, help="마네킹 job_id")
    parser.add_argument("--region",  default="upper", choices=["upper", "lower", "full"])
    parser.add_argument("--offset",  type=float, default=0.012)
    args = parser.parse_args()

    full_pipeline(args.garment, args.job_id, args.region, args.offset)
