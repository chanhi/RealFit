import torch
import trimesh
import argparse
import numpy as np
import cv2
import math
import os

# ==========================================
# ⭐️ PyTorch 2.6 호환성 패치
# ==========================================
_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = _patched_load
# ==========================================

from hmr2.models import load_hmr2, DEFAULT_CHECKPOINT, download_models

def euler_angles_to_matrix(theta, device='cpu'):
    """[x, y, z] 각도(라디안)를 받아 3x3 회전 행렬을 만듭니다."""
    x, y, z = theta[0], theta[1], theta[2]
    
    rx = torch.tensor([
        [1.0, 0.0, 0.0],
        [0.0, math.cos(x), -math.sin(x)],
        [0.0, math.sin(x), math.cos(x)]
    ], device=device)
    
    ry = torch.tensor([
        [math.cos(y), 0.0, math.sin(y)],
        [0.0, 1.0, 0.0],
        [-math.sin(y), 0.0, math.cos(y)]
    ], device=device)
    
    rz = torch.tensor([
        [math.cos(z), -math.sin(z), 0.0],
        [math.sin(z), math.cos(z), 0.0],
        [0.0, 0.0, 1.0]
    ], device=device)
    
    return torch.mm(rz, torch.mm(ry, rx))

def get_target_pose_rotmat(pose_type='A-pose', device='cpu'):
    pose = torch.eye(3, device=device).view(1, 1, 3, 3).repeat(1, 23, 1, 1)
    
    if pose_type == 'A-pose':
        # ⭐️ 수정됨: 관절 번호를 '어깨(15, 16)'로 정확히 수정하고 각도를 60도(1.0)로 내림
        # 15번: 왼쪽 어깨 (화면상 오른쪽 팔)
        # 16번: 오른쪽 어깨 (화면상 왼쪽 팔)
        
        # [X, Y, Z]
        # Z축을 1.0 라디안(약 57도)으로 설정하여 팔을 몸통에 차분하게 붙입니다.
        pose[0, 15] = euler_angles_to_matrix([0.0, 0.0, -1.0], device)   
        pose[0, 16] = euler_angles_to_matrix([0.0, 0.0, 1.0], device)
        
    return pose

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--img', type=str, required=True, help='입력 사진 경로')
    parser.add_argument('--height', type=float, default=175.0, help='사용자 키 (cm)')
    parser.add_argument('--pose', type=str, default='A-pose', choices=['A-pose', 'T-pose'])
    parser.add_argument('--out', type=str, default='standard_mannequin.obj', help='저장할 파일명')
    args = parser.parse_args()

    print("🤖 4D-Humans 모델 로딩 중...")
    download_models()
    
    model, model_cfg = load_hmr2(DEFAULT_CHECKPOINT)
    # device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
    device = torch.device('cuda') if os.getenv('AI_MODE') == 'prod' and torch.cuda.is_available() else torch.device('cpu')
    model = model.to(device)
    model.eval()

    print("🔍 사진에서 체형 정보 추출 중...")
    img_cv2 = cv2.imread(args.img)
    if img_cv2 is None:
        print(f"❌ 에러: '{args.img}' 사진을 찾을 수 없습니다.")
        return

    img_resized = cv2.resize(img_cv2, (256, 256))
    img_tensor = torch.from_numpy(img_resized).float().permute(2, 0, 1) / 255.0
    
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    img_tensor = (img_tensor - mean) / std
    img_tensor = img_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        out = model({'img': img_tensor})
        pred_betas = out['pred_smpl_params']['betas']

    custom_pose = get_target_pose_rotmat(args.pose, device)
    custom_global_orient = torch.eye(3, device=device).view(1, 1, 3, 3)

    smpl_out = model.smpl(betas=pred_betas, body_pose=custom_pose, global_orient=custom_global_orient)
    vertices = smpl_out.vertices[0].detach().cpu().numpy()
    faces = model.smpl.faces

    min_y, max_y = vertices[:, 1].min(), vertices[:, 1].max()
    current_height = max_y - min_y
    estimated_height_cm = current_height * 100.0
    
    print(f"📏 [AI Body Estimator] 4D-Humans가 사진에서 예측한 아바타 실제 키: {estimated_height_cm:.1f}cm")
    
    # 4D-Humans 오리지널 체형 및 실제 높이 비율을 훼손하지 않기 위해 강제 스케일링을 비활성화하고 1.0 배율을 유지합니다.
    scale_factor = 1.0
    vertices = vertices * scale_factor
    
    vertices[:, 1] -= vertices[:, 1].min()
    vertices[:, 0] -= (vertices[:, 0].max() + vertices[:, 0].min()) / 2
    vertices[:, 2] -= (vertices[:, 2].max() + vertices[:, 2].min()) / 2

    mesh = trimesh.Trimesh(vertices, faces)
    mesh.export(args.out)
    print(f"🎉 성공! 완벽한 A-Pose 마네킹이 저장되었습니다: {args.out}")

if __name__ == '__main__':
    main()
