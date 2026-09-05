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

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
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
    except Exception as e:
        print(f"[!] Startup seed warning: {e}")
    finally:
        db.close()

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}

@app.get("/debug-db", tags=["Health"])
def debug_db(db: Session = Depends(get_db)):
    from app.models.domain import Parcel
    return {
        "db_url": settings.DATABASE_URL,
        "count": db.query(Parcel).count(),
        "parcels": [p.parcel_code for p in db.query(Parcel).all()]
    }

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to BHUMI-SATYA Evidence API Service",
        "health": "/health",
        "docs": "/docs"
    }
