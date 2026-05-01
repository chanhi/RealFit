# app/api/routes/appropriate_size.py
# 체형 측정치를 받아 적합한 사이즈의 상품 목록을 반환하는 API 엔드포인트입니다.
#
# [app/main.py 에 아래 2줄 추가 필요]
#   from app.api.routes.appropriate_size import router as size_router
#   app.include_router(size_router)

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.clothdata import Product, init_db          # 모델 + 시드
from app.services.size_recommend import get_size_recommendation  # 사이즈 계산

router = APIRouter(prefix="/api/v1/products", tags=["Products"])

# 서버 시작 시 DB 초기화 (테이블 생성 + 시드 삽입)
init_db()


@router.get("/appropriate-size")
def get_appropriate_size_products(
    chest_cm: float = Query(..., description="가슴 단면 cm — bodyMeasurements.chest_width_cm 값을 그대로 전달"),
    db: Session = Depends(get_db),
):
    """
    체형 측정치(chest_cm)로 추천 사이즈를 계산하고
    해당 사이즈에 맞는 상품 목록을 반환합니다.

    호출 예시:
      GET /api/v1/products/appropriate-size?chest_cm=51.0
    """
    # 1. 사이즈 추천 (size_recommend.py)
    recommendation = get_size_recommendation(chest_cm)

    # 2. DB에서 해당 사이즈 상품 조회 (clothdata.py)
    products = (
        db.query(Product)
        .filter(Product.size_label == recommendation["size"])
        .order_by(Product.price)
        .all()
    )

    # 3. 응답 반환
    return {
        "success": True,
        "recommendation": recommendation,   # { size, detail }
        "products": [
            {
                "id":          p.id,
                "name":        p.name,
                "brand":       p.brand,
                "price":       p.price,
                "imageUrl":    p.image_url,
                "category":    p.category,
                "size_label":  p.size_label,
                "chest_cm":    p.chest_cm,
                "shoulder_cm": p.shoulder_cm,
            }
            for p in products
        ],
        "count": len(products),
    }
