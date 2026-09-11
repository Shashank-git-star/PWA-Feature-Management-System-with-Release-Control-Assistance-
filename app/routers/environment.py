from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import EnvironmentModel
from app.schemas.environment import EnvironmentCreate, EnvironmentResponse

router = APIRouter(prefix="/environments", tags=["Environments"])

# CREATE
@router.post("/", response_model=EnvironmentResponse, status_code=status.HTTP_201_CREATED)
def create_environment(env: EnvironmentCreate, db: Session = Depends(get_db)):
    existing_env = db.query(EnvironmentModel).filter(EnvironmentModel.name == env.name).first()
    if existing_env:
        raise HTTPException(status_code=400, detail="Environment already exists")
    
    db_env = EnvironmentModel(name=env.name, description=env.description)
    db.add(db_env)
    db.commit()
    db.refresh(db_env)
    return db_env

# READ (All)
@router.get("/", response_model=List[EnvironmentResponse])
def list_environments(db: Session = Depends(get_db)):
    return db.query(EnvironmentModel).all()

# READ (Single by ID)
@router.get("/{env_id}", response_model=EnvironmentResponse)
def get_environment(env_id: int, db: Session = Depends(get_db)):
    env = db.query(EnvironmentModel).filter(EnvironmentModel.id == env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env

# UPDATE
@router.put("/{env_id}", response_model=EnvironmentResponse)
def update_environment(env_id: int, env_update: EnvironmentCreate, db: Session = Depends(get_db)):
    db_env = db.query(EnvironmentModel).filter(EnvironmentModel.id == env_id).first()
    if not db_env:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    db_env.name = env_update.name
    db_env.description = env_update.description
    db.commit()
    db.refresh(db_env)
    return db_env

# DELETE
@router.delete("/{env_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_environment(env_id: int, db: Session = Depends(get_db)):
    db_env = db.query(EnvironmentModel).filter(EnvironmentModel.id == env_id).first()
    if not db_env:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    db.delete(db_env)
    db.commit()
    return None