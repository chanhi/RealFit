## 현재 상태

- Docker 실행 가능
- PostgreSQL 연결 완료
- 백엔드 docs 확인 가능: http://localhost:8000/docs
- AI 더미 서버 확인 가능: http://localhost/ai/health

## 실행 전 준비

- Docker Desktop 실행
- backend 폴더에서 명령어 실행
- `.env` 파일 필요

## 실행

- backend 폴더에서 powershell / cmd
- docker compose down -v
- docker compose up --build

## 프론트 연결용 api

- POST /api/v1/jobs
- GET /api/v1/jobs/{job_id}
- GET /api/v1/jobs/{job_id}/result

- /api/v1/jobs 요청 curl 예시

curl -X POST "http://localhost:8000/api/v1/jobs" \
 -F "user_image=@./user.png" \
 -F "cloth_image=@./cloth.png" \
 -F "category=top"

응답 :
{"success":true,"message":"Job created successfully","data":{"job_id":"6840c85e-5c79-41ac-82fe-ca49c4ddb78e","status":"COMPLETED","category":"top","user_image_path":"storage/input/6840c85e-5c79-41ac-82fe-ca49c4ddb78e/user.png","cloth_image_path":"storage/input/6840c85e-5c79-41ac-82fe-ca49c4ddb78e/cloth.png","result_image_path":"https://v3b.fal.media/files/b/0a96dfa0/zyHFw_wAmIQPeJhX16jDS_tripo_model_855a2675-0348-4c0f-945d-c543433bda99.glb","error_message":null}}%

## 주의사항

- .env 확인
- 프론트는 우선 더미 결과 기준으로 연결 가능

## AI 서버 환경

1. `basicModel_neutral_lbs_10_207_0_v1.0.0.pkl` 파일을 다운로드합니다.
2. 다운로드한 파일을 프로젝트의 `ai_server/data/` 폴더 안에 넣습니다.
3. 도커를 빌드합니다.

- `docker compose down`
- `docker compose up -d --build`
- `docker compose up -d`

- 빌드 후 확인용 코드
  `docker compose logs -f ai_server`
- cuda가 뜨면 성공
- http://localhost:9002/docs

모든 API는 http://localhost:8000 (또는 Nginx 포트)를 통해 접근할 수 있으며, AI 서버로 프록시됩니다.

### 현재 구현된 API 명세

#### 의류 누끼 추출 API

- Endpoint: POST /ai/preprocess/garment
- Description: 업로드된 의류 사진의 배경을 제거(Rembg)하여 투명한 PNG로 반환합니다.
- Request: multipart/form-data
  - file: 의류 이미지 파일 (UploadFile)
- Response: image/png (바이너리 데이터)

#### 3D 마네킹 생성 및 렌더링 API

- Endpoint: POST /ai/preprocess/human
- Description: 사용자 전신 사진을 분석하여 3D 마네킹 객체(.obj), 매쉬 데이터(.json), VTON용 전면 렌더링 이미지(.png)를 생성하고 Nginx 정적 파일 URL을 반환합니다.
- Request: multipart/form-data
  - file: 사용자 전신 이미지 파일 (UploadFile)
- Response: application/json

```JSON
{
    "status": "success",
    "job_id": "ff2b329b",
    "urls": {
        "mannequin_obj": "/static/ff2b329b_A_pose_mannequin.obj",
        "mannequin_mesh": "/static/ff2b329b_mesh_data.json",
        "front_image": "/static/ff2b329b_vton_front.png"
    }
}
```

(프론트엔드에서는 응답받은 urls 값을 통해 http://localhost/static/... 로 파일에 즉시 접근/다운로드할 수 있습니다.)

### (참고)실서버 배포 시 GPU 전환 가이드라인

현재 로컬 개발 환경(RTX 50 시리즈 등 최신 아키텍처)과 PyTorch/CUDA 버전 충돌 이슈로 인해, AI 서버는 임시로 CPU를 사용하여 연산하도록 강제 설정되어 있습니다. (마네킹 추출에 약 5~15초 소요)
추후 AWS, GCP 등의 실제 클라우드 GPU 서버(T4, A10G 등)로 배포할 때는 연산 속도 최적화를 위해 아래 2곳의 코드를 반드시 GPU(cuda) 모드로 수정해야 합니다.

수정 파일 1: ai_server/generate_mannequin.py (약 62번째 줄)

```python
# [현재 - 로컬 테스트용]
device = torch.device('cpu')

# [변경 - 실서버 배포용]
device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
```

수정 파일 2: ai_server/services/human_service.py (약 17번째 줄)

```Python
# [현재 - 로컬 테스트용]
self.device = torch.device("cpu")

# [변경 - 실서버 배포용]
self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
```

- docker-compose의 ai-server에서 `AI_MODE=test # 모드 설정 (test: 더미 고속 반환 / prod: 실제 AI 모델 연산 및 GPU 활성화)`

참고사항: 실서버(EC2 등)에 배포할 때는 호스트 머신에 NVIDIA 그래픽 드라이버와 nvidia-container-toolkit이 올바르게 설치되어 있어야 docker-compose.yml의 GPU 할당(deploy 옵션)이 정상 작동합니다.
