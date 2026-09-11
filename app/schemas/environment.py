from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# What data is required when creating an environment
class EnvironmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

# What data is returned to the user
class EnvironmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True