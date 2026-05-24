from fastapi import FastAPI
from pathlib import Path

# 분리될 라우터들 임포트 (다음 단계에서 생성할 예정입니다)
from routers import preprocess_router, vton_router, tripo_router

app = FastAPI(title="RealFit AI Server", version="2.0")

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