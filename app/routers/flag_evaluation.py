from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.cache import get_cached_evaluation, set_cached_evaluation
from app.services.evaluation import evaluate_flag
from fastapi import HTTPException
from typing import Optional

router = APIRouter(prefix="/flags", tags=["Flag Evaluation"])

class EvaluationRequest(BaseModel):
    flag_key: str
    environment: str
    user_id: Optional[int] = None
    group_id: Optional[int] = None

class EvaluationResponse(BaseModel):
    flag_key: str
    value: bool
    environment: str
    user_id: Optional[int] = None
    group_id: Optional[int] = None
    reason: str

@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate_flag_endpoint(req: EvaluationRequest, db: Session = Depends(get_db)):
    # TRY REDIS FIRST
    cached = get_cached_evaluation(req.flag_key, req.environment, req.user_id, req.group_id)
    if cached:
        return EvaluationResponse(
            flag_key=req.flag_key,
            environment=req.environment,
            user_id=req.user_id,
            group_id=req.group_id,
            value=cached["value"],
            reason=cached["reason"] + " (From Cache)"
        )
    # IF NOT IN CACHE, RUN DB LOGIC
    result_dict = evaluate_flag(db, req.flag_key, req.environment, req.user_id, req.group_id)
    
    if result_dict is None:
        raise HTTPException(status_code=404, detail="Flag/Env not found")

    # SAVE TO REDIS FOR NEXT TIME
    set_cached_evaluation(req.flag_key, req.environment, req.user_id, result_dict, req.group_id)
    
    return EvaluationResponse(
        flag_key=req.flag_key,
        environment=req.environment,
        user_id=req.user_id,
        group_id=req.group_id,
        value=result_dict["value"],
        reason=result_dict["reason"]
    )