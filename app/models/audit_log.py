from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True) # Will link to User table
    action = Column(String, nullable=False)   # e.g., "CREATE_FLAG", "UPDATE_FLAG", "TOGGLE_FLAG"
    details = Column(String, nullable=False)  # Description of what changed
    created_at = Column(DateTime(timezone=True), server_default=func.now())