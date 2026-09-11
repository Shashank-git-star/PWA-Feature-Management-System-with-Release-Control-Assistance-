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
    rollout_percentage: int = 0

class FeatureFlagUpdate(BaseModel):
    description: Optional[str] = None
    default_value: Optional[str] = None
    enabled: Optional[bool] = None
    owner_team: Optional[str] = None
    rollout_percentage: Optional[int] = None

class FeatureFlagResponse(BaseModel):
    id: int
    key: str
    description: Optional[str] = None
    flag_type: str
    default_value: str
    enabled: bool
    owner_team: Optional[str] = None
    created_at: datetime
    rollout_percentage: int   

    class Config:
        from_attributes = True