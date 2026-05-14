"""
ai_server/main_extended.py  (신규 추가 — 기존 main.py 변경 없음)
────────────────────────────────────────────────────────────────
기존 app 을 그대로 import 한 뒤,
Tripo3D → 마네킹 적용 라우터만 추가로 마운트합니다.

docker-compose 또는 Dockerfile 에서 실행 명령만 바꿔주세요:

  기존: uvicorn main:app ...
  변경: uvicorn main_extended:app ...
"""

# 기존 app 을 그대로 가져옴 (라우터·서비스 전부 포함)
from main import app  # noqa: F401  (기존 main.py, 변경 없음)

from routers.tripo_router import router as tripo_router

# 신규 라우터만 추가
app.include_router(tripo_router)
