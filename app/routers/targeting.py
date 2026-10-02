from fastapi import APIRouter, Depends, HTTPException
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
    db_rule = TargetingRuleModel(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    log_action(db, "CREATE_TARGETING_RULE", admin_user.id, f"{rule.target_type}:{rule.target_identifier}", None, str(rule.value), flag_id=rule.flag_id, commit=False)
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