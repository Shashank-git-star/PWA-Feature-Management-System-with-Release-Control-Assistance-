from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import FeatureFlagModel
from app.schemas.feature_flag import FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagResponse
from app.services.cache import invalidate_flag_cache
from app.services.audit import log_action

router = APIRouter(prefix="/flags", tags=["Feature Flags"])

# CREATE
@router.post("/", response_model=FeatureFlagResponse, status_code=status.HTTP_201_CREATED)
def create_feature_flag(flag: FeatureFlagCreate, db: Session = Depends(get_db)):
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
    db.add(db_flag)
    db.commit()
    db.refresh(db_flag)
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
def update_feature_flag(flag_id: int, flag_update: FeatureFlagUpdate, db: Session = Depends(get_db)):
    db_flag = db.query(FeatureFlagModel).filter(FeatureFlagModel.id == flag_id).first()
    if not db_flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    old_state = f"Enabled: {db_flag.enabled}, Rollout: {db_flag.rollout_percentage}%"
    
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
    new_state = f"Enabled: {db_flag.enabled}, Rollout: {db_flag.rollout_percentage}%"
    log_action(
        db,
        action="UPDATE_FLAG_SETTINGS",
        performed_by="ADMIN_CONSOLE",
        target=db_flag.key,
        old_val=old_state,
        new_val=new_state,
        commit=False
    )
    invalidate_flag_cache(db_flag.key)
    db.commit()
    db.refresh(db_flag)
    return db_flag

# DELETE
@router.delete("/{flag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature_flag(flag_id: int, db: Session = Depends(get_db)):
    db_flag = db.query(FeatureFlagModel).filter(FeatureFlagModel.id == flag_id).first()
    if not db_flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    db.delete(db_flag)
    db.commit()
    return None