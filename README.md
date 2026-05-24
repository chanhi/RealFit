## Commit 규칙

```
//Header, Body, Footer는 빈 행으로 구분한다
Type(스코프): 주제(제목) // Header

본문 // Body

바닥글 // Footer
```

| 타입 이름 | 내용                                                     |
| --------- | -------------------------------------------------------- |
| feat      | 새로운 기능에 대한 commit                                |
| fix       | 버그 수정에 대한 commit                                  |
| build     | 빌드 관련 파일 수정 or 모듈 설치 또는 삭제에 대한 commit |
| chore     | 기타 commit                                              |
| ci        | ci 관련 설정 수정에 대한 commit                          |
| docs      | 문서 수정에 대한 commit                                  |
| refactor  | 코드 리팩토링에 대한 commit                              |
| test      | 테스트 코드 수정에 대한 commit                           |
| pref      | 성능 개선에 대한 commit                                  |

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
- `docker compose build --no-cache ai_server`: 캐시된 빌드내용까지 완전 처음부터 빌드
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

#### `AI_MODE=test` 모드에서 각 api 입력 데이터 예시

---

### 🧪 0. 테스트 사전 준비 (더미 파일 세팅)

테스트 모드에서는 연산을 건너뛰고 기존 파일을 복사하여 반환하므로, 로컬 컴퓨터의 `ai_server/dummy/` 폴더 안에 아래의 파일들이 미리 들어있어야 에러 없이 완벽하게 작동합니다.

- `test_front.png` (전신 마네킹 이미지)
- `test_cloth.png` (의류 이미지)
- `vton_result.png` (VTON 테스트 모드에서 반환할 가상의 결과 이미지)
- `result.glb` (Tripo3D 테스트 모드에서 반환할 가상의 3D 모델 파일)

---

### 🚀 1. 전처리 API 테스트 (Preprocess)

브라우저에서 FastAPI Docs(`http://localhost:9002/docs`)에 접속하여 진행합니다.

#### ① 마네킹 및 매쉬 추출 (`POST /ai/preprocess/human`)

- **목적:** 사용자 사진에서 마네킹 이미지와 3D 매쉬 체형 데이터를 추출합니다.
- **Request Body:**

```json
{
  "image_url": "/static/test_front.png"
}
```

- **기대 결과:** 기존 `HumanService`의 로직에 따라 추출된 데이터 경로(또는 더미 응답)가 반환됩니다.

#### ② 의류 누끼 처리 (`POST /ai/preprocess/garment`)

- **목적:** 옷 이미지의 배경을 제거합니다.
- **Request Body:**

```json
{
  "image_url": "/static/test_cloth.png"
}
```

- **기대 결과:** 누끼 처리된 의류 이미지의 정적 URL이 반환됩니다.

---

### 👕 2. 2D 가상 피팅 API 테스트 (VTON)

리팩토링으로 가장 깔끔해진 핵심 엔드포인트입니다.

#### ① VTON 합성 (`POST /ai/vton`)

- **목적:** 전처리된 마네킹 이미지와 의류 이미지를 합성합니다.
- **Request Body:**

```json
{
  "front_file_url": "/static/test_front.png",
  "cloth_file_url": "/static/test_cloth.png"
}
```

- **기대 결과:** 테스트 모드이므로 1초 만에 `vton_result.png`를 복사한 새로운 URL을 반환합니다.

```json
{
  "status": "success",
  "url": "/static/1a2b3c4d_vton_result.png"
}
```

---

### 🧊 3. 3D 모델링 API 테스트 (Tripo3D & Mesh)

프론트엔드의 진행률 관리를 위해 2단계로 분리된 파이프라인입니다.

#### ① 초기 3D 객체 생성 (`POST /ai/tripo/generate`)

- **목적:** VTON 결과 이미지를 바탕으로 기본 3D 모델(GLB)을 생성합니다.
- **Request Body:** (`job_id`는 프론트엔드에서 세션을 구분하기 위해 넘겨주는 임의의 문자열입니다.)

```json
{
  "job_id": "test_job_001",
  "vton_image_url": "/static/vton_result.png"
}
```

- **기대 결과:** 테스트 모드에 의해 `result.glb`가 복사되어 반환됩니다.

```json
{
  "status": "success",
  "step": "generation",
  "model_3d_url": "/static/test_job_001_tripo_result.glb"
}
```

#### ② 체형 데이터(Mesh) 반영 (`POST /ai/tripo/apply-mesh`)

- **목적:** 방금 생성된 3D 객체에 사용자의 고유 체형(매쉬) 데이터를 입혀 최종 변형합니다.
- **Request Body:** (`mannequin_mesh_url`은 실제 파일이 없어도 문자열만 형식을 맞춰주면 테스트 모드에서 통과됩니다.)

```json
{
  "job_id": "test_job_001",
  "model_3d_url": "/static/test_job_001_tripo_result.glb",
  "mannequin_mesh_url": "/static/dummy_mesh.json"
}
```

- **기대 결과:**

```json
{
  "status": "success",
  "step": "mesh_applied",
  "final_model_url": "/static/test_job_001_final_mesh.glb"
}
```

---

### 💡 문제 발생 시 체크리스트

- **500 Internal Server Error 발생 시:** 가장 높은 확률로 `dummy` 폴더 안에 요청한 이름의 파일(`test_front.png`, `vton_result.png` 등)이 없기 때문입니다. 더미 폴더에 파일이 잘 들어있는지 확인해 주세요.
- **`AI_MODE`가 변경되지 않는 경우:** 코드나 환경 변수를 수정했다면 반드시 `docker compose down` 후 `docker compose build ai_server`를 통해 재빌드를 거쳐야 새로운 세팅이 반영됩니다.

참고사항: 실서버(EC2 등)에 배포할 때는 호스트 머신에 NVIDIA 그래픽 드라이버와 nvidia-container-toolkit이 올바르게 설치되어 있어야 docker-compose.yml의 GPU 할당(deploy 옵션)이 정상 작동합니다.
