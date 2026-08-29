from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
import app.models.feature_flag
from app.schemas.override import OverrideCreate, OverrideUpdate, OverrideResponse
from app.models.environment import EnvironmentModel

router = APIRouter(prefix="/overrides", tags=["Environment Overrides"])

# 1. CREATE an override
@router.post("/", response_model=OverrideResponse, status_code=status.HTTP_201_CREATED)
def create_override(override: OverrideCreate, db: Session = Depends(get_db)):
    # Verify that the feature flag exists
    flag = db.query(app.models.feature_flag.FeatureFlagModel).filter(app.models.feature_flag.FeatureFlagModel.id == override.feature_flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
        
    # Verify that the environment exists
    env = db.query(app.models.environment.EnvironmentModel).filter(app.models.environment.EnvironmentModel.id == override.environment_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
        
    # Check if an override already exists for this specific flag in this environment
    existing_override = db.query(app.models.feature_flag.EnvironmentOverrideModel).filter(
        app.models.feature_flag.EnvironmentOverrideModel.feature_flag_id == override.feature_flag_id,
        app.models.feature_flag.EnvironmentOverrideModel.environment_id == override.environment_id
    ).first()
    
    if existing_override:
        raise HTTPException(status_code=400, detail="Override for this flag in this environment already exists. Use PUT to update.")
    
    db_override = app.models.feature_flag.EnvironmentOverrideModel(
        feature_flag_id=override.feature_flag_id,
        environment_id=override.environment_id,
        value=override.value,
        enabled=override.enabled
    )
    db.add(db_override)
    db.commit()
    db.refresh(db_override)
    return db_override

# 2. READ (All overrides)
@router.get("/", response_model=List[OverrideResponse])
def list_overrides(db: Session = Depends(get_db)):
    return db.query(app.models.feature_flag.EnvironmentOverrideModel).all()

# 3. UPDATE an override
@router.put("/{override_id}", response_model=OverrideResponse)
def update_override(override_id: int, override_update: OverrideUpdate, db: Session = Depends(get_db)):
    db_override = db.query(app.models.feature_flag.EnvironmentOverrideModel).filter(app.models.feature_flag.EnvironmentOverrideModel.id == override_id).first()
    if not db_override:
        raise HTTPException(status_code=404, detail="Environment override not found")
        
    if override_update.value is not None:
        db_override.value = override_update.value
    if override_update.enabled is not None:
        db_override.enabled = override_update.enabled
        
    db.commit()
    db.refresh(db_override)
    return db_override

# 4. DELETE an override
@router.delete("/{override_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_override(override_id: int, db: Session = Depends(get_db)):
    db_override = db.query(app.models.feature_flag.EnvironmentOverrideModel).filter(app.models.feature_flag.EnvironmentOverrideModel.id == override_id).first()
    if not db_override:
        raise HTTPException(status_code=404, detail="Environment override not found")
        
    db.delete(db_override)
    db.commit()
    return None