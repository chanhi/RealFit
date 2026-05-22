"""
ai_server/services/tripo_mesh_service.py  (신규 추가)
────────────────────────────────────────────────────
Tripo3D GLB → 마네킹 메쉬 드레이프 적용 서비스
기존 파일 변경 없음.
"""

import json
import logging
from pathlib import Path

import httpx
import numpy as np
import trimesh

logger = logging.getLogger(__name__)


# ── 내부 유틸 ────────────────────────────────────────────────────────────────

def _download_file(url: str, dest: str) -> str:
    with httpx.Client(timeout=120) as c:
        r = c.get(url)
        r.raise_for_status()
    Path(dest).write_bytes(r.content)
    logger.info(f"Downloaded {url} → {dest}")
    return dest


def _load_mesh(path: str) -> trimesh.Trimesh:
    """OBJ / GLB / GLTF → 단일 Trimesh (Scene이면 병합)"""
    loaded = trimesh.load(path, force="mesh", process=False)
    if isinstance(loaded, trimesh.Scene):
        if not loaded.geometry:
            raise ValueError(f"빈 Scene: {path}")
        loaded = trimesh.util.concatenate(list(loaded.geometry.values()))
    return loaded


def _normalize(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    """높이 1.0, Y 바닥 기준 원점 정규화"""
    mesh = mesh.copy()
    b = mesh.bounds
    h = b[1][1] - b[0][1]
    if h < 1e-6:
        raise ValueError("메쉬 높이가 0에 가깝습니다.")
    s = 1.0 / h
    c = (b[0] + b[1]) / 2.0
    c[1] = b[0][1]
    mesh.apply_scale(s)
    mesh.apply_translation(-c * s)
    return mesh


def _align_to_mannequin(
    garment: trimesh.Trimesh,
    mannequin: trimesh.Trimesh,
) -> trimesh.Trimesh:
    """의류를 마네킹 상반신(허리 위) 기준으로 스케일·위치 정렬"""
    g = garment.copy()
    mb = mannequin.bounds
    m_h = mb[1][1] - mb[0][1]
    waist_y = mb[0][1] + m_h * 0.45
    upper_h = mb[1][1] - waist_y
    cx = (mb[0][0] + mb[1][0]) / 2
    cz = (mb[0][2] + mb[1][2]) / 2

    gb = g.bounds
    g_h = gb[1][1] - gb[0][1]
    if g_h > 1e-6:
        g.apply_scale(upper_h / g_h)

    nb = g.bounds
    g.apply_translation([
        cx - (nb[0][0] + nb[1][0]) / 2,
        waist_y - nb[0][1],
        cz - (nb[0][2] + nb[1][2]) / 2,
    ])
    return g


def _drape_onto_mannequin(
    garment: trimesh.Trimesh,
    mannequin: trimesh.Trimesh,
    offset: float = 0.012,
) -> trimesh.Trimesh:
    """각 의류 정점 → 마네킹 최근접 표면점 + 법선 방향 offset 이동"""
    d = garment.copy()
    closest, _, tri_ids = mannequin.nearest.on_surface(np.array(d.vertices))
    normals = mannequin.face_normals[tri_ids]
    d.vertices = closest + normals * offset
    return d


# ── 공개 서비스 ──────────────────────────────────────────────────────────────

class TripoMeshService:
    """
    사용법:
        svc = TripoMeshService()
        result = svc.apply_url(job_id, tripo_glb_url, mannequin_obj_path)
        result = svc.apply_file(job_id, local_glb_path, mannequin_obj_path)
    """

    def __init__(self, workspace_dir: str = "/app/shared/dummy"):
        self.ws = Path(workspace_dir)
        self.ws.mkdir(parents=True, exist_ok=True)

    # ── 메인 파이프라인 (내부 공통) ──────────────────────────────────────────

    def _run(
        self,
        job_id: str,
        glb_path: str,
        mannequin_path: str,
        region: str,
        offset: float,
    ) -> dict:
        garment   = _load_mesh(glb_path)
        mannequin = _load_mesh(mannequin_path)

        mannequin_region = self._mask_region(mannequin, region)
        g_norm   = _normalize(garment)
        m_norm   = _normalize(mannequin_region)
        g_align  = _align_to_mannequin(g_norm, m_norm)
        g_draped = _drape_onto_mannequin(g_align, m_norm, offset)

        # 원본 마네킹 스케일로 복원
        m_height = mannequin.bounds[1][1] - mannequin.bounds[0][1]
        g_final  = g_draped.copy()
        g_final.apply_scale(m_height)

        # 저장
        draped_path = str(self.ws / f"{job_id}_garment_draped.glb")
        g_final.export(draped_path)

        merged = trimesh.util.concatenate([
            self._color(mannequin, [212, 192, 150, 200]),
            self._color(g_final,   [240, 240, 240, 230]),
        ])
        merged_path = str(self.ws / f"{job_id}_merged.glb")
        merged.export(merged_path)

        json_path = self._save_mesh_json(g_final, job_id)

        return {
            "draped_glb": draped_path,
            "merged_glb": merged_path,
            "mesh_json":  json_path,
        }

    def apply_url(
        self,
        job_id: str,
        tripo_glb_url: str,
        mannequin_obj_path: str,
        region: str = "upper",
        offset: float = 0.012,
    ) -> dict:
        """Tripo3D GLB URL → 마네킹 적용"""
        glb_path = str(self.ws / f"{job_id}_tripo_raw.glb")
        _download_file(tripo_glb_url, glb_path)
        return self._run(job_id, glb_path, mannequin_obj_path, region, offset)

    def apply_file(
        self,
        job_id: str,
        local_glb_path: str,
        mannequin_obj_path: str,
        region: str = "upper",
        offset: float = 0.012,
    ) -> dict:
        """로컬 GLB 파일 → 마네킹 적용"""
        return self._run(job_id, local_glb_path, mannequin_obj_path, region, offset)

    # ── 헬퍼 ─────────────────────────────────────────────────────────────────

    def _mask_region(self, mannequin: trimesh.Trimesh, region: str) -> trimesh.Trimesh:
        if region == "full":
            return mannequin.copy()
        b = mannequin.bounds
        waist_y = b[0][1] + (b[1][1] - b[0][1]) * 0.45
        verts = np.array(mannequin.vertices)
        faces = np.array(mannequin.faces)
        if region == "upper":
            mask = np.all(verts[faces, 1] >= waist_y, axis=1)
        else:
            mask = np.all(verts[faces, 1] <= waist_y, axis=1)
        sub = mannequin.submesh([np.where(mask)[0]], append=True)
        return sub if (sub and len(sub.vertices) > 0) else mannequin.copy()

    @staticmethod
    def _color(mesh: trimesh.Trimesh, rgba: list) -> trimesh.Trimesh:
        m = mesh.copy()
        m.visual = trimesh.visual.ColorVisuals(
            mesh=m,
            vertex_colors=np.tile(np.array(rgba, dtype=np.uint8), (len(m.vertices), 1)),
        )
        return m

    def _save_mesh_json(self, mesh: trimesh.Trimesh, job_id: str) -> str:
        path = str(self.ws / f"{job_id}_garment_mesh.json")
        with open(path, "w") as f:
            json.dump({"vertices": mesh.vertices.tolist(), "faces": mesh.faces.tolist()}, f)
        return path
