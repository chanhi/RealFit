"""
ai_server/routers/tripo_router.py  (신규 추가)
────────────────────────────────────────────────────
POST /ai/apply-garment  엔드포인트

기존 파일 변경 없음.
main_extended.py 가 이 라우터를 include 합니다.
"""

import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from services.tripo_mesh_service import TripoMeshService

router = APIRouter()

WORKSPACE_DIR    = Path("/app/shared/dummy")
NGINX_STATIC_URL = "/static"

tripo_service = TripoMeshService(workspace_dir=str(WORKSPACE_DIR))


@router.post("/ai/apply-garment")
async def apply_garment(
    # Tripo3D GLB: URL 또는 파일 업로드 중 하나 필수
    tripo_glb_url:  str        = Form(None),
    tripo_glb_file: UploadFile = File(None),

    # 마네킹: 기존 job_id 재활용 또는 OBJ URL 직접 지정
    job_id:            str = Form(None),
    mannequin_obj_url: str = Form(None),

    # 옵션
    garment_region: str   = Form("upper"),   # "upper" | "lower" | "full"
    drape_offset:   float = Form(0.012),
):
    """
    Tripo3D GLB 결과를 마네킹 메쉬에 드레이프(적용)합니다.

    입력 조합:
      A) tripo_glb_url  + job_id            → URL GLB + 기존 마네킹 재활용
      B) tripo_glb_url  + mannequin_obj_url → 두 URL 모두 다운로드
      C) tripo_glb_file + job_id            → 업로드 GLB + 기존 마네킹 재활용

    응답:
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
    # ── 입력 검증 ──────────────────────────────────────────────────────────
    if not tripo_glb_url and not tripo_glb_file:
        raise HTTPException(
            status_code=422,
            detail="tripo_glb_url 또는 tripo_glb_file 중 하나를 제공해야 합니다.",
        )
    if not job_id and not mannequin_obj_url:
        raise HTTPException(
            status_code=422,
            detail="job_id 또는 mannequin_obj_url 중 하나를 제공해야 합니다.",
        )
    if garment_region not in ("upper", "lower", "full"):
        raise HTTPException(
            status_code=422,
            detail="garment_region 은 'upper' | 'lower' | 'full' 이어야 합니다.",
        )

    apply_job_id = job_id or str(uuid.uuid4())[:8]

    try:
        # ── 마네킹 OBJ 경로 확정 ──────────────────────────────────────────
        if job_id:
            mannequin_path = str(WORKSPACE_DIR / f"{job_id}_A_pose_mannequin.obj")
            if not Path(mannequin_path).exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"job_id '{job_id}' 마네킹 OBJ 파일을 찾을 수 없습니다.",
                )
        else:
            import httpx as _httpx
            mannequin_path = str(WORKSPACE_DIR / f"{apply_job_id}_mannequin_dl.obj")
            with _httpx.Client(timeout=120) as c:
                r = c.get(mannequin_obj_url)
                r.raise_for_status()
            Path(mannequin_path).write_bytes(r.content)

        # ── GLB: 업로드 파일 or URL ────────────────────────────────────────
        if tripo_glb_file:
            glb_path = str(WORKSPACE_DIR / f"{apply_job_id}_tripo_upload.glb")
            async with aiofiles.open(glb_path, "wb") as f:
                await f.write(await tripo_glb_file.read())
            result = tripo_service.apply_file(
                job_id=apply_job_id,
                local_glb_path=glb_path,
                mannequin_obj_path=mannequin_path,
                region=garment_region,
                offset=drape_offset,
            )
        else:
            result = tripo_service.apply_url(
                job_id=apply_job_id,
                tripo_glb_url=tripo_glb_url,
                mannequin_obj_path=mannequin_path,
                region=garment_region,
                offset=drape_offset,
            )

        return JSONResponse(content={
            "status": "success",
            "job_id": apply_job_id,
            "urls": {
                "draped_glb": f"{NGINX_STATIC_URL}/{Path(result['draped_glb']).name}",
                "merged_glb": f"{NGINX_STATIC_URL}/{Path(result['merged_glb']).name}",
                "mesh_json":  f"{NGINX_STATIC_URL}/{Path(result['mesh_json']).name}",
            },
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Garment Apply Error: {str(e)}")
