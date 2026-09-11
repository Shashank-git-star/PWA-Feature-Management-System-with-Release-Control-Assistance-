import hashlib
from sqlalchemy.orm import Session
from app.models.feature_flag import FeatureFlagModel, EnvironmentOverrideModel
from app.models.environment import EnvironmentModel
from app.models.targeting_rule import TargetingRuleModel
from app.models.user import UserModel

def get_user_bucket(user_id: int, flag_key: str) -> int:
    """Deterministic hashing"""
    hash_input = f"{user_id}:{flag_key}"
    hash_value = hashlib.md5(hash_input.encode()).hexdigest()
    return int(hash_value, 16) % 100

def evaluate_flag(db: Session, flag_key: str, environment_name: str, user_id: int = None, group_id: int = None):
    # Fetch Flag & Environment
    flag = db.query(FeatureFlagModel).filter(FeatureFlagModel.key == flag_key.strip()).first()
    env = db.query(EnvironmentModel).filter(EnvironmentModel.name == environment_name.strip()).first()
    
    if not flag:
        return {"value": False, "reason": "flag_not_found"}
    if not env:
        return {"value": False, "reason": "environment_not_found"}

    # Global Kill-switch
    if not flag.enabled:
        return {"value": False, "reason": "disabled_globally"}

    # User Specific Targeting
    if user_id:
        user_rule = db.query(TargetingRuleModel).filter(
            TargetingRuleModel.flag_id == flag.id,
            TargetingRuleModel.target_type == "USER",
            TargetingRuleModel.target_identifier == str(user_id)
        ).first()
        
        if user_rule:
            return {"value": user_rule.value, "reason": "user_targeting_match"}

        # Group Specific Targeting
        user_record = db.query(UserModel).filter(
            UserModel.id == user_id,
            UserModel.is_active.is_(True)
        ).first()
        if user_record and user_record.group_id:
            group_rule = db.query(TargetingRuleModel).filter(
                TargetingRuleModel.flag_id == flag.id,
                TargetingRuleModel.target_type == "GROUP",
                TargetingRuleModel.target_identifier == str(user_record.group_id)
            ).first()
            
            if group_rule:
                return {"value": group_rule.value, "reason": "group_targeting_match"}

        # Percentage Rollout
        if flag.rollout_percentage > 0:
            bucket = get_user_bucket(user_id, flag.key)
            if bucket < flag.rollout_percentage:
                return {"value": True, "reason": "percentage_rollout"}

    if group_id:
        group_rule = db.query(TargetingRuleModel).filter(
            TargetingRuleModel.flag_id == flag.id,
            TargetingRuleModel.target_type == "GROUP",
            TargetingRuleModel.target_identifier == str(group_id)
        ).first()
        if group_rule:
            return {"value": group_rule.value, "reason": "group_targeting_match"}

    # Environment Overrides
    override = db.query(EnvironmentOverrideModel).filter(
        EnvironmentOverrideModel.feature_flag_id == flag.id,
        EnvironmentOverrideModel.environment_id == env.id
    ).first()
    
    if override and override.enabled:
        return {"value": override.value, "reason": "environment_override"}

    # Default Value
    final_val = True if str(flag.default_value).lower() == "true" else False
    return {"value": final_val, "reason": "default_value"}