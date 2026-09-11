from sqlalchemy.orm import relationship
from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    #Group Association
    group_id = Column(Integer, ForeignKey("user_groups.id"), nullable=True)
    group = relationship("UserGroupModel", back_populates="users")

    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())