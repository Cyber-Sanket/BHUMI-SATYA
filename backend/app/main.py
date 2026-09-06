from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, get_db
from app.api import auth, projects, parcels, evidence, alerts, landowner

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="BHUMI-SATYA: Interoperable Evidence & Decision Support Layer over Land Acquisition",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

# Netlify production & preview origins, plus standard localhost dev origins
default_origins = [
    "https://bhumi-satya.netlify.app",
    "http://localhost:5173",
    "http://localhost:3000",
]
for d in default_origins:
    if d not in origins:
        origins.append(d)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(parcels.router, prefix=settings.API_V1_STR)
app.include_router(evidence.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(landowner.router, prefix=settings.API_V1_STR)

from app.services.seed_service import seed_initial_data_if_needed
from app.database import SessionLocal

@app.on_event("startup")
def startup_event():
    # Automatically create tables if not exist
    Base.metadata.create_all(bind=engine)
    # Ensure demo users and initial dataset exist idempotently
    try:
        db = SessionLocal()
        seed_initial_data_if_needed(db)
    except Exception:
        print("[!] Startup check: initial record verification skipped.")
    finally:
        db.close()

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to BHUMI-SATYA Evidence API Service",
        "health": "/health",
        "docs": "/docs"
    }
