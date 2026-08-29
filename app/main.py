from fastapi import FastAPI
from app.routers import environment, feature_flag, override, auth
from app.database import engine, Base
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Infy Project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.include_router(environment.router)
app.include_router(feature_flag.router)
app.include_router(override.router)
app.include_router(auth.router)
@app.get("/")
def read_root():
    return {"message": "Application runs successfully and connects to PostgreSQL!"}