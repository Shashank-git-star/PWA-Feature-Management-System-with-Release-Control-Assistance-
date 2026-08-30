from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.evaluation import evaluate_flag

router = APIRouter(prefix="/flags", tags=["Flag Evaluation"])

class EvaluationRequest(BaseModel):
    flag_key: str
    environment: str

class EvaluationResponse(BaseModel):
    flag_key: str
    value: bool

@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate_feature_flag(payload: EvaluationRequest, db: Session = Depends(get_db)):
    final_value = evaluate_flag(db, payload.flag_key, payload.environment)
    return {
        "flag_key": payload.flag_key,
        "value": final_value
    }