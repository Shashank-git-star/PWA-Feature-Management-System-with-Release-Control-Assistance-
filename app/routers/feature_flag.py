from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import FeatureFlagModel, UserModel
from app.routers.auth import get_current_user, require_admin
from app.schemas.feature_flag import FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagResponse
from app.services.cache import invalidate_flag_cache
from app.services.audit import log_action

router = APIRouter(
    prefix="/flags",
    tags=["Feature Flags"],
    dependencies=[Depends(get_current_user)],
)

# CREATE
@router.post("/", response_model=FeatureFlagResponse, status_code=status.HTTP_201_CREATED)
def create_feature_flag(
    flag: FeatureFlagCreate,
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(require_admin)
):
    existing_flag = db.query(FeatureFlagModel).filter(FeatureFlagModel.key == flag.key).first()
    if existing_flag:
        raise HTTPException(status_code=400, detail="Feature flag with this key already exists")
    
    db_flag = FeatureFlagModel(
        key=flag.key,
        description=flag.description,
        flag_type=flag.flag_type,
        default_value=flag.default_value,
        enabled=flag.enabled,
        owner_team=flag.owner_team,
        rollout_percentage=flag.rollout_percentage
    )
    user_id_val = admin_user.id
    db.add(db_flag)
    db.commit()
    db.refresh(db_flag)
    log_action(
        db,
        action="CREATE_FLAG",
        performed_by=user_id_val,
        target=db_flag.key,
        old_val=None,
        new_val=f"Created flag with type {db_flag.flag_type}",
        flag_id=db_flag.id,
        commit=False
    )
    db.commit()
    return db_flag

# READ (All)
@router.get("/", response_model=List[FeatureFlagResponse])
def list_feature_flags(db: Session = Depends(get_db)):
    return db.query(FeatureFlagModel).all()

# READ (Single by ID)
@router.get("/{flag_id}", response_model=FeatureFlagResponse)
def get_feature_flag(flag_id: int, db: Session = Depends(get_db)):
    flag = db.query(FeatureFlagModel).filter(FeatureFlagModel.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return flag

# UPDATE
@router.put("/{flag_id}", response_model=FeatureFlagResponse)
def update_feature_flag(
    flag_id: int,
    flag_update: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(require_admin)
):
    db_flag = db.query(FeatureFlagModel).filter(FeatureFlagModel.id == flag_id).first()
    if not db_flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    old_values = {
        "description": db_flag.description,
        "default_value": db_flag.default_value,
        "enabled": db_flag.enabled,
        "owner_team": db_flag.owner_team,
        "rollout_percentage": db_flag.rollout_percentage,
    }
    old_enabled = db_flag.enabled
    old_rollout_percentage = db_flag.rollout_percentage
    old_state = f"Enabled: {old_enabled}, Rollout: {old_rollout_percentage}%"
    
    # Update only fields that are provided
    if flag_update.description is not None:
        db_flag.description = flag_update.description
    if flag_update.default_value is not None:
        db_flag.default_value = flag_update.default_value
    if flag_update.enabled is not None:
        db_flag.enabled = flag_update.enabled
    if flag_update.owner_team is not None:
        db_flag.owner_team = flag_update.owner_team
    if flag_update.rollout_percentage is not None:
        db_flag.rollout_percentage = flag_update.rollout_percentage

    if all(getattr(db_flag, field) == value for field, value in old_values.items()):
        return db_flag

    new_state = f"Enabled: {db_flag.enabled}, Rollout: {db_flag.rollout_percentage}%"
    user_id_val = admin_user.id
    action = "UPDATE_FLAG_SETTINGS"
    if flag_update.enabled is not None and flag_update.enabled != old_enabled:
        action = "ENABLE_FLAG" if flag_update.enabled else "DISABLE_FLAG"
    elif flag_update.rollout_percentage is not None and flag_update.rollout_percentage != old_rollout_percentage:
        action = "UPDATE_ROLLOUT"
    log_action(
        db,
        action=action,
        performed_by=user_id_val,
        target=db_flag.key,
        old_val=old_state,
        new_val=new_state,
        flag_id=db_flag.id,
        commit=False
    )
    invalidate_flag_cache(db_flag.key)
    db.commit()
    db.refresh(db_flag)
    return db_flag

# DELETE
@router.delete("/{flag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature_flag(
    flag_id: int,
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(require_admin),
):
    db_flag = db.query(FeatureFlagModel).filter(FeatureFlagModel.id == flag_id).first()
    if not db_flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    user_id_val = admin_user.id
    log_action(
        db,
        action="DELETE_FLAG",
        performed_by=user_id_val,
        target=db_flag.key,
        old_val=f"Flag with type {db_flag.flag_type} was deleted",
        new_val=None,
        flag_id=db_flag.id,
        commit=False
    )
    db.delete(db_flag)
    db.commit()
    return None