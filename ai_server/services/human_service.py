import os
import json
import subprocess
import torch
import cv2
import numpy as np
from pathlib import Path
from pytorch3d.io import load_objs_as_meshes
from pytorch3d.renderer import (
    look_at_view_transform, FoVPerspectiveCameras, RasterizationSettings,
    MeshRasterizer, MeshRenderer, SoftPhongShader, PointLights, TexturesVertex
)

class HumanService:
    def __init__(self):
        self.base_path = Path("/app")
        # Nginx와 공유되는 dummy 폴더로 작업 경로를 변경합니다.[cite: 4]
        self.workspace_dir = self.base_path / "shared" / "dummy"
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        self.fourd_humans_dir = self.base_path / "4D-Humans"
        # 모드에 따른 CPU/GPU 자동 할당
        self.mode = os.getenv("AI_MODE", "test").lower()
        if self.mode == "prod" and torch.cuda.is_available():
            self.device = torch.device("cuda:0")
            print("🚀 [PROD MODE] HumanService: GPU(CUDA) 활성화됨")
        else:
            self.device = torch.device("cpu")
            print("⚡ [TEST MODE] HumanService: CPU 모드로 동작함")

    def extract_3d_mannequin(self, image_path: str, job_id: str) -> str:
        """4D-Humans OBJ 추출"""
        obj_output_path = self.workspace_dir / f"{job_id}_A_pose_mannequin.obj"
        script_path = self.fourd_humans_dir / "generate_mannequin.py"
        
        command = [
            "python", str(script_path),
            "--img", image_path,
            "--height", "175.0",
            "--pose", "A-pose",
            "--out", str(obj_output_path)
        ]
        
        subprocess.run(command, check=True, cwd=str(self.fourd_humans_dir))
        return str(obj_output_path)

    def extract_mesh_data(self, obj_path: str, job_id: str) -> str:
        """매쉬 데이터(Vertices, Faces)를 추출하여 JSON 파일로 저장합니다."""
        mesh = load_objs_as_meshes([obj_path], device=self.device)
        verts = mesh.verts_packed().tolist()
        faces = mesh.faces_packed().tolist()
        
        mesh_data = {
            "vertices": verts,
            "faces": faces
        }
        
        json_path = self.workspace_dir / f"{job_id}_mesh_data.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(mesh_data, f)
            
        return str(json_path)
    
    def correct_3d_mannequin(self, obj_path: str, mesh_url: str, job_id: str) -> str:
        """메쉬 데이터와 합성 결과를 사용해 3D 마네킹을 보정합니다."""
        # 현재는 더미 GLB 결과를 반환하도록 구현되어 있습니다.
        # 실제 동작에서 mesh_url을 다운로드하거나 로컬 파일 경로로 변환한 뒤 보정 로직을 추가하세요.
        return "/app/shared/dummy/result.glb"

    def render_mannequin_views(self, obj_path: str, job_id: str, vton_target="upper") -> dict:
        """PyTorch3D 전면 렌더링 (후면 제거)"""
        mesh = load_objs_as_meshes([obj_path], device=self.device)
        verts = mesh.verts_packed()

        center_y = (verts[:, 1].max() + verts[:, 1].min()) / 2.0
        upper_color, lower_color = (0.3, 0.9) if vton_target == "upper" else (0.9, 0.3)
        
        color_tensor = torch.zeros_like(verts)
        color_tensor[verts[:, 1] >= center_y] = upper_color
        color_tensor[verts[:, 1] < center_y] = lower_color
        mesh.textures = TexturesVertex(verts_features=color_tensor.unsqueeze(0))

        # ⭐️ Tripo3D 사용을 위해 후면을 제거하고 전면(front)만 유지합니다.[cite: 2]
        views = {"front": 0.0}
        raster_settings = RasterizationSettings(image_size=512, blur_radius=0.0, faces_per_pixel=1)
        results = {}

        for view_name, azim_angle in views.items():
            R, T = look_at_view_transform(dist=2.8, elev=0.0, azim=azim_angle, at=((0.0, center_y.item(), 0.0),))
            cameras = FoVPerspectiveCameras(device=self.device, R=R, T=T)
            lights = PointLights(device=self.device, location=T)

            renderer = MeshRenderer(
                rasterizer=MeshRasterizer(cameras=cameras, raster_settings=raster_settings),
                shader=SoftPhongShader(device=self.device, cameras=cameras, lights=lights)
            )

            rgb_img = renderer(mesh)[0, ..., :3].cpu().numpy()
            out_path = self.workspace_dir / f"{job_id}_vton_{view_name}.png"
            cv2.imwrite(str(out_path), cv2.cvtColor((rgb_img * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
            results[view_name] = str(out_path)

        return results