from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Project, Corridor
from app.schemas.dto import ProjectCreate, ProjectResponse, CorridorResponse

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    existing = db.query(Project).filter(Project.code == project_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project code '{project_in.code}' already exists")
    project = Project(
        name=project_in.name,
        code=project_in.code,
        state=project_in.state,
        district=project_in.district
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}/corridors", response_model=List[CorridorResponse])
def get_project_corridors(project_id: str, db: Session = Depends(get_db)):
    corridors = db.query(Corridor).filter(Corridor.project_id == project_id).all()
    return corridors
