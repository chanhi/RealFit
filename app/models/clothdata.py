# app/models/clothdata.py
# Product DB 모델 + 더미 옷 치수 시드 데이터를 정의합니다.
# 실제 DB 연동 시 SEED_PRODUCTS 내용만 교체하면 됩니다.

from sqlalchemy import Column, String, Integer, Float, Text
from app.db.session import Base, SessionLocal, engine


class Product(Base):
    __tablename__ = "products"

    id           = Column(String,  primary_key=True, index=True)
    name         = Column(String,  nullable=False)
    brand        = Column(String,  nullable=False)
    price        = Column(Integer, nullable=False)
    image_url    = Column(Text,    nullable=False)
    category     = Column(String,  nullable=False)
    size_label   = Column(String,  nullable=False)  # XS / S / M / L / XL / XXL
    chest_cm     = Column(Float,   nullable=True)   # 가슴 단면 (cm)
    shoulder_cm  = Column(Float,   nullable=True)   # 어깨 너비 (cm)


# 더미 옷 치수 시드 데이터 (사이즈별 커버리지)
SEED_PRODUCTS = [
    # XS
    {"id": "p_xs1", "name": "Men Check Shirt",            "brand": "STUDIO BLANK", "price":  35000, "image_url": "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/1.webp",                        "category": "Shirts",      "size_label": "XS",  "chest_cm": 45.0, "shoulder_cm": 40.0},
    {"id": "p_xs2", "name": "Classic White Crop Tee",     "brand": "ROUGH",        "price":  32000, "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600",                            "category": "T-Shirts",    "size_label": "XS",  "chest_cm": 44.0, "shoulder_cm": 39.0},
    # S
    {"id": "p_s1",  "name": "Man Plaid Shirt",            "brand": "URBAN",        "price":  38000, "image_url": "https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/1.webp",                        "category": "Shirts",      "size_label": "S",   "chest_cm": 48.0, "shoulder_cm": 43.0},
    {"id": "p_s2",  "name": "Classic Basic T-Shirt",      "brand": "COTTON LAB",   "price":  29000, "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600",                            "category": "T-Shirts",    "size_label": "S",   "chest_cm": 47.0, "shoulder_cm": 42.0},
    {"id": "p_s3",  "name": "Relaxed Linen Shirt",        "brand": "URBAN",        "price":  58000, "image_url": "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=600",                            "category": "Shirts",      "size_label": "S",   "chest_cm": 49.0, "shoulder_cm": 44.0},
    # M
    {"id": "p_m1",  "name": "Blue & Black Check Shirt",   "brand": "DUMMY WEAR",   "price":  45000, "image_url": "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp",               "category": "Shirts",      "size_label": "M",   "chest_cm": 51.0, "shoulder_cm": 46.0},
    {"id": "p_m2",  "name": "Black Minimalist Sweatshirt","brand": "STUDIO BLANK", "price":  65000, "image_url": "https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/1.webp",                 "category": "Sweatshirts", "size_label": "M",   "chest_cm": 52.0, "shoulder_cm": 47.0},
    {"id": "p_m3",  "name": "Cozy Beige Turtleneck",      "brand": "OUR STUDIO",   "price":  95000, "image_url": "/images/beige-turtleneck.png",                                                                       "category": "Knitwear",    "size_label": "M",   "chest_cm": 52.0, "shoulder_cm": 46.0},
    {"id": "p_m4",  "name": "Slim Fit Polo Shirt",        "brand": "DUMMY WEAR",   "price":  42000, "image_url": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600",                            "category": "T-Shirts",    "size_label": "M",   "chest_cm": 51.0, "shoulder_cm": 46.0},
    # L
    {"id": "p_l1",  "name": "Gigabyte Aorus Men Tshirt",  "brand": "GAMER FIT",    "price":  32000, "image_url": "https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/1.webp",              "category": "T-Shirts",    "size_label": "L",   "chest_cm": 54.0, "shoulder_cm": 49.0},
    {"id": "p_l2",  "name": "Vintage Leather Jacket",     "brand": "ROUGH",        "price": 189000, "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600",                               "category": "Outerwear",   "size_label": "L",   "chest_cm": 55.0, "shoulder_cm": 50.0},
    {"id": "p_l3",  "name": "Brooklyn Grey Sweatshirt",   "brand": "CIDER",        "price":  49000, "image_url": "/images/brooklyn-sweatshirt.png",                                                                    "category": "Sweatshirts", "size_label": "L",   "chest_cm": 54.0, "shoulder_cm": 49.0},
    # XL
    {"id": "p_xl1", "name": "Oversized Plaid Shirt",      "brand": "COTTON LAB",   "price":  68000, "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600",                            "category": "Shirts",      "size_label": "XL",  "chest_cm": 56.0, "shoulder_cm": 51.0},
    {"id": "p_xl2", "name": "Marni Red & Black Suit",     "brand": "ELEGANCE",     "price": 215000, "image_url": "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/1.webp",              "category": "Outerwear",   "size_label": "XL",  "chest_cm": 57.0, "shoulder_cm": 52.0},
    {"id": "p_xl3", "name": "White Duffle Zip-up Jacket", "brand": "WINTER LAB",   "price": 115000, "image_url": "/images/white-duffle-jacket.png",                                                                    "category": "Outerwear",   "size_label": "XL",  "chest_cm": 58.0, "shoulder_cm": 52.0},
    # XXL
    {"id": "p_xxl1","name": "Essential Cotton Hoodie",    "brand": "COTTON LAB",   "price":  72000, "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600",                               "category": "Sweatshirts", "size_label": "XXL", "chest_cm": 61.0, "shoulder_cm": 55.0},
]


def init_db():
    """테이블 생성 + 시드 데이터 삽입 (비어있을 때만 실행)"""
    Product.__table__.create(bind=engine, checkfirst=True)
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            for d in SEED_PRODUCTS:
                db.add(Product(**d))
            db.commit()
    finally:
        db.close()
