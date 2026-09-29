from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user_group import UserGroupModel
from app.models.user import UserModel
from app.schemas.targeting import UserGroupCreate, UserGroupResponse
from typing import List
from app.services.audit import log_action
from app.routers.auth import require_admin

router = APIRouter(prefix="/groups", tags=["User Groups"])

@router.post("/", response_model=UserGroupResponse)
def create_group(group: UserGroupCreate, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    db_group = UserGroupModel(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    log_action(db, "CREATE_GROUP", admin_user.id, group.name, None, group.name, commit=False)
    db.commit()
    return db_group

@router.get("/", response_model=List[UserGroupResponse])
def list_groups(db: Session = Depends(get_db)):
    return db.query(UserGroupModel).all()

@router.post("/{group_id}/add-user/{user_id}")
def add_user_to_group(group_id: int, user_id: int, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    group = db.query(UserGroupModel).filter(UserGroupModel.id == group_id).first()
    
    if not user or not group:
        raise HTTPException(status_code=404, detail="User or Group not found")
    
    old_group_id = user.group_id
    user.group_id = group_id
    log_action(db, "UPDATE_USER_GROUP", admin_user.id, user.email, str(old_group_id), str(group_id), commit=False)
    db.commit()
    return {"message": f"User {user.email} added to group {group.name}"}