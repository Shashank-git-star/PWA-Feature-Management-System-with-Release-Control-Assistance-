from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from app.database import Base

class TargetingRuleModel(Base):
    __tablename__ = "targeting_rules"

    id = Column(Integer, primary_key=True, index=True)
    flag_id = Column(Integer, ForeignKey("feature_flags.id", ondelete="CASCADE"), nullable=False)
    
    # target_type can be 'USER' or 'GROUP'
    target_type = Column(String, nullable=False) 
    
    target_identifier = Column(String, nullable=False) 
    
    # The value to return if target matches
    value = Column(Boolean, nullable=False)