from pydantic import BaseModel


class JobCreateResponse(BaseModel):
    success: bool
    message: str
    data: dict


class JobStatusResponse(BaseModel):
    success: bool
    message: str
    data: dict


class JobResultResponse(BaseModel):
    success: bool
    message: str
    data: dict