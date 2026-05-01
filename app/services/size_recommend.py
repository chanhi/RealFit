# app/services/size_recommend.py
# 체형 측정치(chest_cm)를 받아 사이즈 레이블(XS~XXL)로 변환합니다.
# appropriate_size.py 에서 import해서 사용합니다.


# ── 사이즈 기준표 ──────────────────────────────────────────────────────
# (가슴 단면 상한 cm, 사이즈 레이블) 순서쌍 리스트
# 예: chest_cm이 49.0 이하면 S, 52.0 이하면 M
# ※ 실제 AI(4D-Humans)가 반환하는 chest_width_cm 스케일에 맞게 숫자 조정 필요
CHEST_SIZE_TABLE = [
    (46.0, "XS"),
    (49.0, "S"),
    (52.0, "M"),
    (55.0, "L"),
    (58.0, "XL"),
    # 58.0 초과는 아래 get_size_label 함수에서 XXL로 처리
]

# 사이즈별 사용자에게 보여줄 설명 문구
SIZE_DETAIL = {
    "XS":  "신체에 딱 맞는 타이트한 슬림핏이 예상됩니다.",
    "S":   "어깨와 가슴선이 단정한 정사이즈 핏입니다.",
    "M":   "가장 편안하고 세련된 스탠다드 핏입니다.",
    "L":   "활동성이 좋은 여유로운 루즈핏입니다.",
    "XL":  "트렌디하게 떨어지는 오버핏 실루엣입니다.",
    "XXL": "체형을 넉넉하게 감싸는 오버핏을 추천합니다.",
}


def get_size_label(chest_cm: float) -> str:
    """
    가슴 단면(cm)을 사이즈 레이블로 변환합니다.

    CHEST_SIZE_TABLE을 순서대로 순회하면서
    chest_cm이 limit 이하인 첫 번째 항목의 레이블을 반환합니다.
    끝까지 해당 없으면 XXL 반환.

    예시:
        get_size_label(30.5) → "XS"   # 46.0 이하이므로 첫 번째에서 바로 반환
        get_size_label(51.0) → "M"    # 46 초과, 49 초과, 52 이하 → M
        get_size_label(60.0) → "XXL"  # 모든 구간 초과 → XXL
    """
    for limit, label in CHEST_SIZE_TABLE:
        if chest_cm <= limit:
            return label
    return "XXL"


def get_size_recommendation(chest_cm: float) -> dict:
    """
    사이즈 레이블과 설명 문구를 묶어서 반환합니다.
    appropriate_size.py의 API 엔드포인트에서 이 함수를 호출합니다.

    Args:
        chest_cm: 프론트 bodyMeasurements.chest_width_cm 값

    Returns:
        { "size": "M", "detail": "가장 편안하고 세련된 스탠다드 핏입니다." }
    """
    size = get_size_label(chest_cm)     # 사이즈 레이블 계산
    return {
        "size": size,
        "detail": SIZE_DETAIL[size],    # 해당 사이즈 설명 문구
    }
