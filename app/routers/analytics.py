from datetime import date, datetime, time, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLogModel, EnvironmentModel, EvaluationEventModel, FeatureFlagModel
from app.models.user import UserModel

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _range(start_date: Optional[date], end_date: Optional[date]):
    end = end_date or date.today()
    start = start_date or (end - timedelta(days=29))
    return datetime.combine(start, time.min), datetime.combine(end, time.max)


@router.get("/metrics")
def dashboard_metrics(db: Session = Depends(get_db)):
    today_start, today_end = _range(date.today(), date.today())
    return {
        "total_flags": db.query(func.count(FeatureFlagModel.id)).scalar() or 0,
        "active_flags": db.query(func.count(FeatureFlagModel.id)).filter(FeatureFlagModel.enabled.is_(True)).scalar() or 0,
        "todays_evaluations": db.query(func.count(EvaluationEventModel.id)).filter(
            EvaluationEventModel.evaluated_at >= today_start,
            EvaluationEventModel.evaluated_at <= today_end
        ).scalar() or 0,
        "audit_logs_today": db.query(func.count(AuditLogModel.id)).filter(
            AuditLogModel.created_at >= today_start,
            AuditLogModel.created_at <= today_end
        ).scalar() or 0
    }


@router.get("/flags")
def flag_analytics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    start, end = _range(start_date, end_date)
    rows = db.query(
        FeatureFlagModel.id,
        FeatureFlagModel.key,
        func.count(EvaluationEventModel.id).label("evaluation_count")
    ).outerjoin(
        EvaluationEventModel,
        (EvaluationEventModel.flag_id == FeatureFlagModel.id)
        & (EvaluationEventModel.evaluated_at >= start)
        & (EvaluationEventModel.evaluated_at <= end)
    ).group_by(FeatureFlagModel.id, FeatureFlagModel.key).order_by(
        func.count(EvaluationEventModel.id).desc()
    ).all()
    return {
        "start_date": start.date(),
        "end_date": end.date(),
        "flags": [
            {"flag_id": row.id, "flag_key": row.key, "evaluation_count": row.evaluation_count}
            for row in rows
        ],
        "most_frequently_evaluated": [
            {"flag_id": row.id, "flag_key": row.key, "evaluation_count": row.evaluation_count}
            for row in rows[:10]
        ]
    }


@router.get("/usage")
def usage_analytics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    start, end = _range(start_date, end_date)
    rows = db.query(
        EnvironmentModel.id,
        EnvironmentModel.name,
        func.count(EvaluationEventModel.id).label("evaluation_count")
    ).outerjoin(
        EvaluationEventModel,
        (EvaluationEventModel.environment_id == EnvironmentModel.id)
        & (EvaluationEventModel.evaluated_at >= start)
        & (EvaluationEventModel.evaluated_at <= end)
    ).group_by(EnvironmentModel.id, EnvironmentModel.name).order_by(
        func.count(EvaluationEventModel.id).desc()
    ).all()
    return {
        "start_date": start.date(),
        "end_date": end.date(),
        "environments": [
            {"environment_id": row.id, "environment": row.name, "evaluation_count": row.evaluation_count}
            for row in rows
        ]
    }
