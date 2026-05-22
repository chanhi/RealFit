from pydantic import BaseModel


class DefaultMannequinResponse(BaseModel):
    success: bool
    message: str
    data: dict


class DefaultMannequinListResponse(BaseModel):
    success: bool
    message: str
    data: list