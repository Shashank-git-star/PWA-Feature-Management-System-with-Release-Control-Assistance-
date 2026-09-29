from datetime import date, datetime, time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit_log import AuditLogModel

router = APIRouter(tags=["Audit Logs"])
@router.get("/audit-logs")
def get_audit_logs(
    user_id: Optional[int] = Query(None),
    flag_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLogModel)
    if user_id is not None:
        query = query.filter(AuditLogModel.user_id == user_id)
    if flag_id is not None:
        query = query.filter(AuditLogModel.flag_id == flag_id)
    if action and action.strip():
        query = query.filter(AuditLogModel.action.ilike(action.strip()))
    if start_date:
        query = query.filter(AuditLogModel.created_at >= datetime.combine(start_date, time.min))
    if end_date:
        query = query.filter(AuditLogModel.created_at <= datetime.combine(end_date, time.max))
    return query.order_by(AuditLogModel.created_at.desc()).limit(500).all()


@router.get("/audit-logs/{log_id}")
def get_audit_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(AuditLogModel).filter(AuditLogModel.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return log