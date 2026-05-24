from sqlalchemy.orm import Session
from app.models.default_mannequin import DefaultMannequin


DEFAULT_MANNEQUINS = [
    {
        "code": "male_basic",
        "name": "남성 기본체형",
        "gender": "male",
        "body_type": "basic",
        "mannequin_obj_url": "storage/default_mannequins/male_basic/model.obj",
        "mannequin_mesh_url": "storage/default_mannequins/male_basic/model.glb",
        "front_image_url": "storage/default_mannequins/male_basic/front.png",
        "thumbnail_url": "storage/default_mannequins/male_basic/thumb.png",
    },
    {
        "code": "male_slim",
        "name": "남성 마른체형",
        "gender": "male",
        "body_type": "slim",
        "mannequin_obj_url": "storage/default_mannequins/male_slim/model.obj",
        "mannequin_mesh_url": "storage/default_mannequins/male_slim/model.glb",
        "front_image_url": "storage/default_mannequins/male_slim/front.png",
        "thumbnail_url": "storage/default_mannequins/male_slim/thumb.png",
    },
    {
        "code": "male_plus",
        "name": "남성 통통한체형",
        "gender": "male",
        "body_type": "plus",
        "mannequin_obj_url": "storage/default_mannequins/male_plus/model.obj",
        "mannequin_mesh_url": "storage/default_mannequins/male_plus/model.glb",
        "front_image_url": "storage/default_mannequins/male_plus/front.png",
        "thumbnail_url": "storage/default_mannequins/male_plus/thumb.png",
    },
    {
        "code": "female_basic",
        "name": "여성 기본체형",
        "gender": "female",
        "body_type": "basic",
        "mannequin_obj_url": "storage/default_mannequins/female_basic/model.obj",
        "mannequin_mesh_url": "storage/default_mannequins/female_basic/model.glb",
        "front_image_url": "storage/default_mannequins/female_basic/front.png",
        "thumbnail_url": "storage/default_mannequins/female_basic/thumb.png",
    },
    {
        "code": "female_slim",
        "name": "여성 마른체형",
        "gender": "female",
        "body_type": "slim",
        "mannequin_obj_url": "storage/default_mannequins/female_slim/model.obj",
        "mannequin_mesh_url": "storage/default_mannequins/female_slim/model.glb",
        "front_image_url": "storage/default_mannequins/female_slim/front.png",
        "thumbnail_url": "storage/default_mannequins/female_slim/thumb.png",
    },
    {
        "code": "female_plus",
        "name": "여성 통통한체형",
        "gender": "female",
        "body_type": "plus",
        "mannequin_obj_url": "storage/default_mannequins/female_plus/model.obj",
        "mannequin_mesh_url": "storage/default_mannequins/female_plus/model.glb",
        "front_image_url": "storage/default_mannequins/female_plus/front.png",
        "thumbnail_url": "storage/default_mannequins/female_plus/thumb.png",
    },
]


def seed_default_mannequins(db: Session):
    for item in DEFAULT_MANNEQUINS:
        exists = db.query(DefaultMannequin).filter(
            DefaultMannequin.code == item["code"]
        ).first()

        if not exists:
            db.add(DefaultMannequin(**item))

    db.commit()


def get_default_mannequins(db: Session):
    return db.query(DefaultMannequin).filter(
        DefaultMannequin.is_active == True
    ).all()


def get_default_mannequin(db: Session, code: str):
    return db.query(DefaultMannequin).filter(
        DefaultMannequin.code == code,
        DefaultMannequin.is_active == True
    ).first()