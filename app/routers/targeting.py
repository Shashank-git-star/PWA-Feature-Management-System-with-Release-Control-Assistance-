from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.targeting_rule import TargetingRuleModel
from app.schemas.targeting import TargetingRuleCreate, TargetingRuleResponse
from app.services.audit import log_action
from app.routers.auth import get_current_user, require_admin

router = APIRouter(
    prefix="/targeting",
    tags=["Targeting Rules"],
    dependencies=[Depends(get_current_user)],
)

@router.post("/", response_model=TargetingRuleResponse)
def create_targeting_rule(rule: TargetingRuleCreate, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    target_type = rule.target_type.strip().upper()
    if target_type not in {"USER", "GROUP"}:
        raise HTTPException(status_code=422, detail="Target type must be USER or GROUP")
    try:
        target_id = int(rule.target_identifier.strip())
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Target identifier must be a positive ID") from error
    if target_id < 1:
        raise HTTPException(status_code=422, detail="Target identifier must be a positive ID")

    target_identifier = str(target_id)
    db_rule = db.query(TargetingRuleModel).filter(
        TargetingRuleModel.flag_id == rule.flag_id,
        func.lower(TargetingRuleModel.target_type) == target_type.lower(),
        TargetingRuleModel.target_identifier == target_identifier,
    ).first()
    if db_rule is not None:
        if db_rule.value == rule.value:
            raise HTTPException(status_code=409, detail="This target already has the requested state")
        old_value = db_rule.value
        db_rule.value = rule.value
        db.commit()
        db.refresh(db_rule)
        log_action(
            db,
            "UPDATE_TARGETING_RULE",
            admin_user.id,
            f"{target_type}:{target_identifier}",
            str(old_value),
            str(rule.value),
            flag_id=rule.flag_id,
            commit=False,
        )
        db.commit()
        return db_rule

    db_rule = TargetingRuleModel(
        flag_id=rule.flag_id,
        target_type=target_type,
        target_identifier=target_identifier,
        value=rule.value,
    )
    db.add(db_rule)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing_rule = db.query(TargetingRuleModel).filter(
            TargetingRuleModel.flag_id == rule.flag_id,
            func.lower(TargetingRuleModel.target_type) == target_type.lower(),
            TargetingRuleModel.target_identifier == target_identifier,
        ).first()
        if existing_rule is None:
            raise
        if existing_rule.value == rule.value:
            raise HTTPException(status_code=409, detail="This target already has the requested state")
        old_value = existing_rule.value
        existing_rule.value = rule.value
        db.commit()
        db.refresh(existing_rule)
        log_action(
            db,
            "UPDATE_TARGETING_RULE",
            admin_user.id,
            f"{target_type}:{target_identifier}",
            str(old_value),
            str(rule.value),
            flag_id=rule.flag_id,
            commit=False,
        )
        db.commit()
        return existing_rule
    db.refresh(db_rule)
    log_action(db, "CREATE_TARGETING_RULE", admin_user.id, f"{target_type}:{target_identifier}", None, str(rule.value), flag_id=rule.flag_id, commit=False)
    db.commit()
    return db_rule

@router.get("/flag/{flag_id}", response_model=List[TargetingRuleResponse])
def get_rules_for_flag(flag_id: int, db: Session = Depends(get_db)):
    return db.query(TargetingRuleModel).filter(TargetingRuleModel.flag_id == flag_id).all()

@router.delete("/{rule_id}")
def delete_targeting_rule(rule_id: int, db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    db_rule = db.query(TargetingRuleModel).filter(TargetingRuleModel.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    log_action(db, "DELETE_TARGETING_RULE", admin_user.id, f"{db_rule.target_type}:{db_rule.target_identifier}", str(db_rule.value), None, flag_id=db_rule.flag_id, commit=False)
    db.delete(db_rule)
    db.commit()
    return {"message": "Rule deleted"}