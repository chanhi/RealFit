```python
# Defining the contents for both markdown documents and writing them to files.

local_guide_content = """# 로컬 AI 서버 환경 설정 및 테스트 가이드라인

본 문서는 `ai_dev` 브랜치에 구현된 가상 피팅 AI 서버 환경을 다른 팀원들이 로컬 PC에 쉽게 구축하고 테스트할 수 있도록 안내하는 가이드라인입니다. 현재 AI 서버는 최신 그래픽카드(RTX 50 시리즈 등) 호환성 및 GPU가 없는 팀원의 환경을 고려하여 **CPU 연산 모드로 안전하게 통합**되어 있습니다.

---

## 🛠️ 1. 사전 요구사항 및 환경 준비

AI 마네킹 생성(4D-Humans) 라이브러리를 정상 구동하려면 저작권 문제로 Git에 포함되지 않은 **SMPL 뼈대 모델 파일이 로컬에 반드시 존재해야 합니다.**

1. **SMPL 모델 파일 다운로드**
   * 팀 공유 드라이브에서 `basicModel_neutral_lbs_10_207_0_v1.0.0.pkl` 파일을 다운로드합니다.
2. **올바른 경로에 배치**
   * 프로젝트 내 `ai_server/data/` 폴더를 생성하고 해당 파일을 넣습니다.
   * **최종 경로 확인:** `RealFit/ai_server/data/basicModel_neutral_lbs_10_207_0_v1.0.0.pkl`

---

## 🐳 2. 도커 컴포즈(Docker Compose) 설정 및 실행

### Case A: NVIDIA GPU(그래픽카드)가 탑재된 Windows/Linux PC 환경
도커 컴포즈 명령어를 통해 전체 서비스를 빌드하고 백그라운드에서 즉시 실행할 수 있습니다.

```

````text
Files successfully generated.

```bash
# 1. 컨테이너 빌드 및 실행 (의존성 동기화를 위해 최초 1회는 빌드 권장)
docker compose down
docker compose build ai_server
docker compose up -d

````

### Case B: Intel/AMD 내장 그래픽 환경 또는 NVIDIA GPU가 없는 환경

`docker-compose.yml` 파일에서 `ai_server` 서비스 하단의 GPU 할당 옵션(`deploy:`)을 주석 처리해야 도커 크래시 없이 실행됩니다.

```yaml
ai_server:
  build:
    context: ./ai_server
    dockerfile: Dockerfile
  # ... (중략) ...
  # ⚠️ GPU가 없는 컴퓨터에서는 아래 블록을 주석 처리해 주세요.
  # deploy:
  #   resources:
  #     reservations:
  #       devices:
  #         - driver: nvidia
  #           count: 1
  #           capabilities: [gpu, utility, compute]
```

### Case C: Apple Silicon (M1/M2/M3) 맥북 환경

맥북 환경에서는 `PyTorch3D` C++ 컴파일 라이브러리 아키텍처 불일치로 인해 빌드가 불가능할 수 있습니다. 메인 백엔드 및 프론트엔드 기능을 중점적으로 개발하는 팀원이라면 AI 서버를 제외하고 필요한 컨테이너만 지정하여 실행하는 것을 강력히 권장합니다.

```bash
# AI 서버를 제외하고 DB, 메인 백엔드, Nginx만 실행
docker compose up -d db backend nginx

```

---

## 📂 3. Nginx 정적 공유 볼륨과 더미 데이터 구조

현재 AI 서버는 연산 결과물 파일 전송 병목을 줄이기 위해 **Nginx 정적 볼륨 공유 방식**을 채택하고 있습니다.

- **로컬 경로:** `ai_server/dummy/`
- **도커 내부 경로:** `/app/shared/dummy/`
- **Nginx 웹 URL:** `http://localhost:9002/static/{파일명}` (또는 Nginx 프록시 설정 포트)

로컬의 `ai_server/dummy/` 폴더에 이미지 파일(예: `test_front.png`, `test_cloth.png`)을 넣으면 도커 컨테이너 내부로 즉시 동기화되어 AI 연산의 입력값으로 바로 사용할 수 있습니다.

---

## 🧪 4. FastAPI Docs를 이용한 가상 피팅 파이프라인 테스트

가장 최근 구축된 통합 의류 합성 파이프라인인 `/ai/preprocess/edit` API를 테스트하는 방법입니다.

1. **테스트 파일 준비**

- 로컬 PC의 `ai_server/dummy/` 폴더 안에 테스트할 전면 이미지(`test_front.png`)와 누끼 의류 이미지(`test_cloth.png`)를 넣어 둡니다. (매쉬 JSON 파일 이름은 테스트 시 문자열로만 채워 넣으므로 실제 파일이 없어도 무방합니다.)

2. **Swagger UI 접속**

- 브라우저에서 `http://localhost:9002/docs`에 접속합니다.

3. **`/ai/preprocess/edit` API 호출**

- **[Try it out]** 버튼을 클릭한 후, 아래와 같이 JSON Body 형식을 입력하고 [Execute]를 누릅니다.

```json
{
  "front_file_url": "/static/test_front.png",
  "cloth_file_url": "/static/test_cloth.png",
  "mannequin_mesh_url": "dummy_mesh_data.json"
}
```

### ⚠️ 중요: CPU 테스트 시 주의사항 (필독)

- **최초 실행 시 대기 시간:** 최초로 합성을 실행할 때, 허깅페이스 허브에서 약 10GB 분량의 가상 피팅용 베이스 모델 데이터를 다운로드합니다. 터미널 창에 `docker compose logs -f ai_server`를 입력하여 다운로드 게이지가 올라가는지 확인하세요. (다운로드된 모델은 `models_cache` 볼륨에 저장되므로 2회차 실행부터는 즉시 연산이 시작됩니다. _이때 로컬에 ai_server/models_cache/ 폴더가 자동 생성되며 약 10GB의 파일이 받아집니다. 용량이 크므로 Git에 절대 Commit하지 않도록 주의하세요!_)
- **CPU 추론 대기 시간:** 현재 환경은 로컬 안정성을 위해 CPU 모드로 연산하므로, 한 번 실행 시 **약 5분에서 15분 정도 브라우저가 Pending(로딩) 상태**로 멈춰있게 됩니다. 타임아웃 오류가 나지 않도록 브라우저 창을 끄지 말고 로그를 확인하며 기다려 주세요.
  """

deployment_guide_content = """# 🚀 AI 서버 클라우드 배포 및 GPU 성능 최적화 가이드라인

본 문서는 로컬 개발 환경(CPU 검증 모드)에서 구축한 가상 피팅 파이프라인을 AWS, GCP 등 가속화 엔진이 탑재된 **실제 클라우드 GPU 배포 서버 환경으로 이전할 때 수정 및 고도화해야 할 명세**를 담고 있습니다.

---

## ⚙️ 1. GPU 하드웨어 가속 전환 (소스 코드 수정)

현재 로컬 아키텍처 버전 충돌을 우회하기 위해 `cpu`로 강제 고정해 둔 파이썬 연산 환경 코드를 모두 GPU(`cuda`) 모드로 원복해야 연산 속도를 크게 단축할 수 있습니다. (배포 인스턴스 전용 드라이버 및 `nvidia-container-toolkit` 설치 필수)

### ① `ai_server/generate_mannequin.py` (마네킹 추출 핵심 스크립트)

- **기존 코드 (CPU 고정):**

```python
device = torch.device('cpu')

```

- **배포용 코드 변경:**

```python
device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')

```

### ② `ai_server/services/human_service.py` (인체 분석 서비스 모듈)

- **기존 코드 (CPU 고정):**

```python
self.device = torch.device("cpu")

```

- **배포용 코드 변경:**

```python
self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

```

### ③ `ai_server/IDM-VTON/run_vton.py` (2D 이미지 의류 합성 스크립트)

- **기존 코드 (CPU 고정 및 메모리 제한):**

```python
device = "cpu"
# pipe.enable_model_cpu_offload() # 주석 처리됨

```

- **배포용 코드 변경 (GPU 매핑 및 VRAM 효율화 최적화):**

```python
device = "cuda"
pipe = pipe.to(device)

# 실서버 배포 시 VRAM Out-Of-Memory(OOM) 방지를 위해 가중치 오프로딩 기법을 활성화합니다.
pipe.enable_model_cpu_offload()

```

---

## 🎨 2. 가상 피팅 출력 품질(Quality) 업그레이드 방안

현재 로컬 API 파이프라인 연동 테스트를 위해 사용 중인 임시 지우개/인페인팅용 베이스 모델을 **상용 서비스 수준의 의류 재질 및 로고가 보존되는 진짜 IDM-VTON 파이프라인으로 고도화**해야 합니다.

### ① 실제 `yisol/IDM-VTON` 전용 파이프라인 교체

- **현재 임시 우회 적용안:** `StableDiffusionXLInpaintPipeline`을 통한 단순 영역 뭉뚱그리기 합성
- **고도화 적용안:** 배포 서버 환경에서 `yisol/IDM-VTON` 공식 리포지토리의 커스텀 UNet 및 가중치 제어기 코드를 가져와 `run_vton.py`에 이식합니다. 옷의 디테일과 핏(Fit)이 무너지지 않고 정교하게 마네킹 몸 위로 매핑됩니다.

### ② Human Parser 및 고정밀 마스크(Agnostic Mask) 자동화 연동

- **현재 임시 우회 적용안:** 전신 영역을 통째로 화이트 마스크로 미는 엉성한 방식 (`Image.new("L", human_img.size, 255)`)
- **고도화 적용안:** 2D VTON 합성 API가 호출되는 시점에 **Human Parser(인체 파싱 모델)** 또는 **DensePose 모델**을 파이프라인 전단에 배치합니다. 사용자의 얼굴, 헤어스타일, 양손, 신발 영역은 완벽하게 보호 구역으로 설정하고 '기존 상의/하의 의류 영역만 정확하게 도려내는 투명 마스크 이미지'를 자동 생성해 줌으로써 정교함을 극대화합니다.

### ③ 추론 반복 스텝(Inference Steps) 복구

- **현재 임시 우회 적용안:** 속도 확보를 위해 스텝 수를 `15`회로 강제 하향 설정 (화질 저하 유발)
- **고도화 적용안:** GPU 환경 배포 시 스텝 수를 원래 권장 사양인 `30 ~ 50`회로 다시 상향 조정합니다. 노이즈 제거 주기가 늘어남에 따라 실제 스튜디오 사진 촬영본 급의 8K 초고화질 출력 이미지를 확보할 수 있게 되며, GPU 성능 덕분에 연산 속도는 단 **10~20초 안팎**으로 완결됩니다.

---

## 🎛️ 3. 클라우드 인프라 최소 사양 및 권장 사양 가이드

배포 서버용 인스턴스 환경을 세팅할 때 원활한 의류 이미지 합성을 가동하기 위한 하드웨어 사양 기준입니다. Stable Diffusion XL(SDXL) 아키텍처 기반이므로 넉넉한 비디오 메모리(VRAM) 확보가 필수적입니다.

- **최소 사양 (Minimum):** NVIDIA T4 GPU (VRAM 16GB) - AWS `g4dn.xlarge` 인스턴스 계열
- **권장 사양 (Recommended):** NVIDIA A10G 또는 L4 GPU (VRAM 24GB 이상) - AWS `g5.xlarge` 인스턴스 계열
- **호스트 OS 필수 구성 요소:**

1. NVIDIA Driver 정식 버전 설치
2. Docker 및 Docker Compose 가동 환경 구축
3. 컨테이너 내부로 GPU 자원을 다이렉트로 바인딩해 주기 위한 **`nvidia-container-toolkit`** 오픈소스 패키지 설치 필수
   """

# Write content to local files

with open("AI_SERVER_TEAM_GUIDE.md", "w", encoding="utf-8") as f:
f.write(local_guide_content)

with open("AI_SERVER_CLOUD_DEPLOYMENT_GUIDE.md", "w", encoding="utf-8") as f:
f.write(deployment_guide_content)

print("Files successfully generated.")
