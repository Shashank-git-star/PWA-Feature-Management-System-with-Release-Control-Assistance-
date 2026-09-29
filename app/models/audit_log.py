from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from datetime import datetime
from zoneinfo import ZoneInfo

INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")
from app.database import Base

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    flag_id = Column(Integer, ForeignKey("feature_flags.id"), nullable=True)
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=True)
    old_state = Column(String, nullable=True)
    new_state = Column(String, nullable=True)
    details = Column(String, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(INDIA_TIMEZONE), server_default=func.now())