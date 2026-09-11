from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from app.database import Base

class FeatureFlagModel(Base):
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    flag_type = Column(String, nullable=False, default="boolean") 
    default_value = Column(String, nullable=False) 
    enabled = Column(Boolean, default=False) # Global ON/OFF switch
    owner_team = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    rollout_percentage = Column(Integer, default=0) # 0 means no rollout, 100 means everyone

class EnvironmentOverrideModel(Base):
    __tablename__ = "environment_overrides"

    id = Column(Integer, primary_key=True, index=True)
    feature_flag_id = Column("flag_id", Integer, ForeignKey("feature_flags.id", ondelete="CASCADE"), nullable=False)
    environment_id = Column(Integer, ForeignKey("environments.id", ondelete="CASCADE"), nullable=False)
    value = Column(Boolean, nullable=False)
    enabled = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())