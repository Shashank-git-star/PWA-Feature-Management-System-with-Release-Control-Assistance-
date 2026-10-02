from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
import app.models.feature_flag
from app.schemas.override import OverrideCreate, OverrideUpdate, OverrideResponse
from app.models import EnvironmentModel
from app.services.audit import log_action
from app.routers.auth import get_current_user, require_admin

router = APIRouter(
    prefix="/overrides",
    tags=["Environment Overrides"],
    dependencies=[Depends(get_current_user)],
)

# CREATE an override
@router.post("/", response_model=OverrideResponse, status_code=status.HTTP_201_CREATED)
def create_override(override: OverrideCreate, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
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
    log_action(db, "CREATE_OVERRIDE", admin_user.id, f"flag:{override.feature_flag_id}/environment:{override.environment_id}", None, f"value={override.value}, enabled={override.enabled}", flag_id=override.feature_flag_id, environment_id=override.environment_id, commit=False)
    db.commit()
    return db_override

# READ (All overrides)
@router.get("/", response_model=List[OverrideResponse])
def list_overrides(db: Session = Depends(get_db)):
    return db.query(app.models.feature_flag.EnvironmentOverrideModel).all()

# UPDATE an override
@router.put("/{override_id}", response_model=OverrideResponse)
def update_override(override_id: int, override_update: OverrideUpdate, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    db_override = db.query(app.models.feature_flag.EnvironmentOverrideModel).filter(app.models.feature_flag.EnvironmentOverrideModel.id == override_id).first()
    if not db_override:
        raise HTTPException(status_code=404, detail="Environment override not found")
        
    old_state = f"value={db_override.value}, enabled={db_override.enabled}"
    if override_update.value is not None:
        db_override.value = override_update.value
    if override_update.enabled is not None:
        db_override.enabled = override_update.enabled
    log_action(db, "UPDATE_OVERRIDE", admin_user.id, f"override:{override_id}", old_state, f"value={db_override.value}, enabled={db_override.enabled}", flag_id=db_override.feature_flag_id, environment_id=db_override.environment_id, commit=False)
    db.commit()
    db.refresh(db_override)
    return db_override

# DELETE an override
@router.delete("/{override_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_override(override_id: int, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    db_override = db.query(app.models.feature_flag.EnvironmentOverrideModel).filter(app.models.feature_flag.EnvironmentOverrideModel.id == override_id).first()
    if not db_override:
        raise HTTPException(status_code=404, detail="Environment override not found")
        
    log_action(db, "DELETE_OVERRIDE", admin_user.id, f"override:{override_id}", f"value={db_override.value}, enabled={db_override.enabled}", None, flag_id=db_override.feature_flag_id, environment_id=db_override.environment_id, commit=False)
    db.delete(db_override)
    db.commit()
    return None