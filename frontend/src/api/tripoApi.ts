/**
 * frontend/src/api/tripoApi.ts  (신규 추가 — 기존 index.ts 변경 없음)
 *
 * Tripo3D → 마네킹 적용 관련 API 함수만 모아둔 파일입니다.
 * 기존 index.ts 의 함수는 그대로 사용하고,
 * 이 파일을 추가로 import 해서 쓰면 됩니다.
 *
 * 사용 예시:
 *   import { preprocessHuman } from './api'            // 기존
 *   import { applyGarmentToMannequin } from './api/tripoApi'  // 신규
 */

const AI_SERVER = import.meta.env.VITE_AI_SERVER_URL ?? "";

export interface ApplyGarmentResult {
  status: string;
  job_id: string;
  urls: {
    /** 의류 드레이프 GLB (의류 메쉬만) */
    draped_glb: string;
    /** 마네킹 + 의류 합성 GLB → MannequinViewer 에 바로 넘기면 됩니다 */
    merged_glb: string;
    /** 의류 메쉬 JSON (vertices + faces) */
    mesh_json: string;
  };
}

/**
 * Tripo3D GLB URL → /ai/apply-garment → 합성 GLB URL 반환
 *
 * @param tripoGlbUrl    to3D() 결과의 model_mesh.url
 * @param mannequinJobId /ai/preprocess/human 에서 받은 job_id
 * @param garmentRegion  "upper" | "lower" | "full"  (기본: "upper")
 * @param drapeOffset    드레이프 오프셋 m (기본: 0.012)
 */
export async function applyGarmentToMannequin(
  tripoGlbUrl: string,
  mannequinJobId: string,
  garmentRegion: "upper" | "lower" | "full" = "upper",
  drapeOffset = 0.012
): Promise<ApplyGarmentResult> {
  const form = new FormData();
  form.append("tripo_glb_url",  tripoGlbUrl);
  form.append("job_id",         mannequinJobId);
  form.append("garment_region", garmentRegion);
  form.append("drape_offset",   String(drapeOffset));

  const res = await fetch(`${AI_SERVER}/ai/apply-garment`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "apply-garment 실패");
  }
  return res.json();
}

/**
 * 로컬 GLB 파일 업로드 → 마네킹 적용
 * (Tripo3D URL 없이 GLB 파일을 직접 가지고 있는 경우)
 */
export async function applyLocalGlbToMannequin(
  glbFile: File,
  mannequinJobId: string,
  garmentRegion: "upper" | "lower" | "full" = "upper",
  drapeOffset = 0.012
): Promise<ApplyGarmentResult> {
  const form = new FormData();
  form.append("tripo_glb_file", glbFile);
  form.append("job_id",         mannequinJobId);
  form.append("garment_region", garmentRegion);
  form.append("drape_offset",   String(drapeOffset));

  const res = await fetch(`${AI_SERVER}/ai/apply-garment`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "apply-garment (local) 실패");
  }
  return res.json();
}
