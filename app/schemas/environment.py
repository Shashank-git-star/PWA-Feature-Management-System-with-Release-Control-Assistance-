from pydantic import BaseModel
from typing import Optional

# What data is required when creating an environment
class EnvironmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

# What data is returned to the user
class EnvironmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True