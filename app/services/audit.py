from sqlalchemy.orm import Session
from app.models.audit_log import AuditLogModel
from datetime import datetime
from zoneinfo import ZoneInfo

INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")

def log_action(
    db: Session,
    action: str,
    performed_by: int,
    target: str,
    old_val: str = None,
    new_val: str = None,
    flag_id: int = None,
    environment_id: int = None,
    commit: bool = True
):
    log = AuditLogModel(
        user_id=performed_by,
        action=action,
        flag_id=flag_id,
        environment_id=environment_id,
        old_state=old_val,
        new_state=new_val,
        details=f"{performed_by} | {target}",
        created_at=datetime.now(INDIA_TIMEZONE)
    )
    db.add(log)
    if commit:
        db.commit()
