from pydantic import BaseModel
from typing import Optional, List

# User Group Schemas
class UserGroupBase(BaseModel):
    name: str

class UserGroupCreate(UserGroupBase):
    pass

class UserGroupResponse(UserGroupBase):
    id: int
    class Config:
        from_attributes = True

# Targeting Rule Schemas
class TargetingRuleBase(BaseModel):
    flag_id: int
    target_type: str  # "USER" or "GROUP"
    target_identifier: str
    value: bool

class TargetingRuleCreate(TargetingRuleBase):
    pass

class TargetingRuleResponse(TargetingRuleBase):
    id: int
    class Config:
        from_attributes = True

# Schema for assigning a user to a group
class UserGroupAssignment(BaseModel):
    user_id: int
    group_id: int