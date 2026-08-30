from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.feature_flag import FeatureFlagModel, EnvironmentOverrideModel
from app.models.environment import EnvironmentModel

def evaluate_flag(db: Session, flag_key: str, environment_name: str) -> bool:
    # 1. Find the flag by its key
    flag = db.query(FeatureFlagModel).filter(FeatureFlagModel.key == flag_key).first()
    if not flag:
        raise HTTPException(status_code=404, detail=f"Flag '{flag_key}' not found")
    
    # 2. Check global enabled state
    if not flag.enabled:
        return False

    # 3. Find the environment by name 
    env = db.query(EnvironmentModel).filter(EnvironmentModel.name == environment_name).first()
    if not env:
        raise HTTPException(status_code=404, detail=f"Environment '{environment_name}' not found")

    # 4. Check if an environment override exists
    override = db.query(EnvironmentOverrideModel).filter(
        EnvironmentOverrideModel.flag_id == flag.id,
        EnvironmentOverrideModel.environment_id == env.id
    ).first()

    if override is not None:
        return override.value

    return flag.default_value