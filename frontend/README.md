# RealFIT — Frontend

> AI 기반 3D 가상 피팅 서비스의 프론트엔드 애플리케이션

## 📌 프로젝트 개요

RealFIT은 사용자가 자신의 전신 사진을 업로드하고, 원하는 의류를 선택하면 AI가 옷을 입힌 결과를 보여주는 가상 피팅 서비스입니다.

### 주요 기능

- **3D Avatar**: 사용자 사진 기반 3D 마네킹 생성 및 뷰어
- **2D Virtual Try-On**: AI 기반 가상 의류 피팅 결과 표시
- **상품 카탈로그**: 카테고리별 의류 브라우징 (Outerwear, T-Shirts, Sweatshirts, Knitwear, Shirts, Misc)
- **클라이언트 배경 제거**: 브라우저 내 AI 누끼 처리 (`@imgly/background-removal`)
- **체형 조각 (Sculpt)**: 3D 모델의 체형 미세 조정
- **Archive**: 피팅 결과 저장 및 관리
- **다크모드**: 라이트/다크 테마 전환

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| 상태관리 | Zustand |
| 3D 렌더링 | Three.js + @react-three/fiber + @react-three/drei |
| 스타일링 | TailwindCSS |
| AI 배경제거 | @imgly/background-removal |

## 🚀 실행 방법

### 1. 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
# .env.local 파일 생성
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
```

### 3. 개발 서버 실행

```bash
npm run dev
# → http://localhost:5173
```

### 4. 프로덕션 빌드

```bash
npm run build
```

## 📂 프로젝트 구조

```
src/
├── api/
│   └── index.ts            # 백엔드 API 클라이언트 (Job 기반 비동기 패턴)
├── components/
│   ├── canvas/
│   │   └── MannequinViewer.tsx  # Three.js 3D 뷰어
│   └── ui/
│       ├── HomePanel.tsx        # 상품 목록 페이지
│       ├── UploadPanel.tsx      # 사진 업로드 + 피팅 제어
│       ├── SculptPanel.tsx      # 체형 조각 도구
│       ├── ArchivePanel.tsx     # 피팅 결과 아카이브
│       └── AboutPanel.tsx       # 서비스 소개
├── data/
│   └── mockProducts.ts      # 상품 데이터 (20개 아이템)
├── store/
│   └── useFittingStore.ts   # Zustand 글로벌 상태 관리
├── styles/                  # CSS 스타일
├── App.tsx                  # 라우팅 + 레이아웃
└── main.tsx                 # 엔트리포인트
```

## 🔗 백엔드 연동

프론트엔드는 백엔드의 **Job 기반 비동기 API**에 연결됩니다.

### API 흐름

```
1. POST /api/v1/jobs        → Job 생성 (user_image + cloth_image + category)
2. GET  /api/v1/jobs/{id}   → 상태 폴링 (2초 간격, 최대 120초)
3. GET  /api/v1/jobs/{id}/result → 결과 조회
```

### 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | 백엔드 API 서버 주소 |

### 백엔드 없이 실행

백엔드 서버 없이도 프론트엔드는 독립적으로 실행됩니다.
- 3D 뷰어: 로컬 mock OBJ 파일로 폴백
- 배경 제거: 클라이언트 사이드 AI로 동작
- VTON: 백엔드 연결 시에만 동작

## 📝 라이선스

Private — RealFIT Team
