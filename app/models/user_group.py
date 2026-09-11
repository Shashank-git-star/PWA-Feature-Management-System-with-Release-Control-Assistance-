from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class UserGroupModel(Base):
    __tablename__ = "user_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    # Relationship to users
    users = relationship("UserModel", back_populates="group")