from fastapi import FastAPI
from pathlib import Path

# Import domain-specific routers (layered architecture)
from routers import preprocess_router, vton_router, tripo_router

app = FastAPI(title="RealFit AI Server", version="2.0")

# Shared workspace directory for Nginx static serving
WORKSPACE_DIR = Path("/app/shared/dummy")
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)
NGINX_STATIC_URL = "/static"

# Register routers (API endpoints separated by domain)
app.include_router(preprocess_router.router, prefix="/ai/preprocess", tags=["Preprocess"])
app.include_router(vton_router.router, prefix="/ai/vton", tags=["VTON"])
app.include_router(tripo_router.router, prefix="/ai/tripo", tags=["3D Generation & Mesh"])

@app.get("/ai/health", tags=["Health"])
def health_check():
    """Server health check API"""
    return {"status": "AI Server is running"}
