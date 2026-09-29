from fastapi import Header, APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.core.security import hash_password, verify_password
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional
from app.models import UserModel as User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# SIGNUP
@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Hash the password before saving
    hashed_pwd = hash_password(user.password)
    
    db_user = User(
        email=user.email,
        hashed_password=hashed_pwd
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find the user by username/email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "access_token": f"fake-super-token-for-{user.email}",
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(),
    }

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    return db.query(User).filter(User.is_active.is_(True)).all()

def require_admin(
    x_user: Optional[str] = Header(default=None, alias="x-user"),
    db: Session = Depends(get_db),
):
    if x_user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        user_id = int(x_user)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid user header format")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user