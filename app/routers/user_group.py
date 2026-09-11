from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user_group import UserGroupModel
from app.models.user import UserModel
from app.schemas.targeting import UserGroupCreate, UserGroupResponse
from typing import List

router = APIRouter(prefix="/groups", tags=["User Groups"])

@router.post("/", response_model=UserGroupResponse)
def create_group(group: UserGroupCreate, db: Session = Depends(get_db)):
    db_group = UserGroupModel(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/", response_model=List[UserGroupResponse])
def list_groups(db: Session = Depends(get_db)):
    return db.query(UserGroupModel).all()

@router.post("/{group_id}/add-user/{user_id}")
def add_user_to_group(group_id: int, user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    group = db.query(UserGroupModel).filter(UserGroupModel.id == group_id).first()
    
    if not user or not group:
        raise HTTPException(status_code=404, detail="User or Group not found")
    
    user.group_id = group_id
    db.commit()
    return {"message": f"User {user.email} added to group {group.name}"}