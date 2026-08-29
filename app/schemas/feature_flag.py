from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FeatureFlagCreate(BaseModel):
    key: str
    description: Optional[str] = None
    flag_type: str = "boolean" 
    default_value: str
    enabled: bool = False
    owner_team: Optional[str] = None

class FeatureFlagUpdate(BaseModel):
    description: Optional[str] = None
    default_value: Optional[str] = None
    enabled: Optional[bool] = None
    owner_team: Optional[str] = None

class FeatureFlagResponse(BaseModel):
    id: int
    key: str
    description: Optional[str] = None
    flag_type: str
    default_value: str
    enabled: bool
    owner_team: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True