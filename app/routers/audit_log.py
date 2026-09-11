from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit_log import AuditLogModel

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLogModel).order_by(AuditLogModel.created_at.desc()).limit(50).all()