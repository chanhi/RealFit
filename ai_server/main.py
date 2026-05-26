from fastapi import FastAPI
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from routers import preprocess_router, vton_router, tripo_router

app = FastAPI(title="RealFit AI Server", version="2.0")

# CORS 미들웨어 등록 (app 생성 직후에 추가)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 개발 및 테스트를 위해 일단 모두 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nginx와 공유하는 워크스페이스 폴더 전역 설정
WORKSPACE_DIR = Path("/app/shared/dummy")
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
NGINX_STATIC_URL = "/static"

# 라우터 등록 (도메인별로 API 분리)
app.include_router(preprocess_router.router, prefix="/ai/preprocess", tags=["Preprocess"])
app.include_router(vton_router.router, prefix="/ai/vton", tags=["VTON"])
app.include_router(tripo_router.router, prefix="/ai/tripo", tags=["3D Generation & Mesh"])

@app.get("/ai/health", tags=["Health"])
def health_check():
    """서버 상태 확인 API"""
    return {"status": "AI Server is running"}


