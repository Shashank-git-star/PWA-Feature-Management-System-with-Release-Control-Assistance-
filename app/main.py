from fastapi import FastAPI
from app.routers import environment, feature_flag, override, auth, flag_evaluation, user_group, targeting, audit_log, analytics
from app.database import engine, Base
from app import models
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Infy Project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(audit_log.router)
app.include_router(analytics.router)
app.include_router(environment.router)
app.include_router(feature_flag.router)
app.include_router(override.router)
app.include_router(flag_evaluation.router)
app.include_router(user_group.router)
app.include_router(targeting.router)

@app.get("/")
def read_root():
    return {"message": "Application runs successfully and connects to PostgreSQL!"}