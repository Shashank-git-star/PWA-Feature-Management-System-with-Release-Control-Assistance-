from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from app.database import Base


class EvaluationEventModel(Base):
    __tablename__ = "evaluation_events"

    id = Column(Integer, primary_key=True, index=True)
    flag_id = Column(Integer, ForeignKey("feature_flags.id", ondelete="CASCADE"), nullable=False, index=True)
    environment_id = Column(Integer, ForeignKey("environments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("user_groups.id"), nullable=True)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
