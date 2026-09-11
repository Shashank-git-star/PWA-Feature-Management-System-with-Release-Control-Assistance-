from sqlalchemy.orm import Session
from app.models.audit_log import AuditLogModel
from datetime import datetime
from zoneinfo import ZoneInfo

INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")

def log_action(
    db: Session,
    action: str,
    performed_by: str,
    target: str,
    old_val: str = None,
    new_val: str = None,
    commit: bool = True
):
    log = AuditLogModel(
        user_id=None,
        action=action,
        details=f"{performed_by} | {target}: {old_val or 'NULL'} -> {new_val or 'NULL'}",
        created_at=datetime.now(INDIA_TIMEZONE)
    )
    db.add(log)
    if commit:
        db.commit()
