from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OverrideCreate(BaseModel):
    feature_flag_id: int
    environment_id: int
    value: bool
    enabled: bool

class OverrideUpdate(BaseModel):
    value: Optional[bool] = None
    enabled: Optional[bool] = None

class OverrideResponse(BaseModel):
    id: int
    feature_flag_id: int
    environment_id: int
    value: bool
    enabled: bool
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True