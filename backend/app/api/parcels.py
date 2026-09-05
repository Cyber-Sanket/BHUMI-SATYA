from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Parcel, VerdictType, User, AcquisitionStage
from app.schemas.dto import ParcelResponse, ParcelStageUpdate
from app.services.audit_service import audit_service
from app.auth.rbac import get_current_user

router = APIRouter(prefix="/parcels", tags=["Parcels"])

@router.get("", response_model=List[ParcelResponse])
@router.get("/", response_model=List[ParcelResponse])
def list_parcels(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Parcel)
    if project_id:
        query = query.filter(Parcel.project_id == project_id)
    return query.order_by(Parcel.parcel_code.asc()).all()

@router.get("/{id}", response_model=ParcelResponse)
def get_parcel(id: str, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter((Parcel.id == id) | (Parcel.parcel_code == id)).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel

@router.post("/{id}/stage", response_model=ParcelResponse)
def update_parcel_stage(
    id: str,
    stage_in: ParcelStageUpdate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    parcel = db.query(Parcel).filter((Parcel.id == id) | (Parcel.parcel_code == id)).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    old_stage = parcel.current_stage.value
    new_stage = stage_in.target_stage

    # STATE MACHINE RULE: Sensitive transitions require VERIFIED verdict
    sensitive_stages = [AcquisitionStage.POSSESSION_VERIFIED, AcquisitionStage.COMPLETED]
    if new_stage in sensitive_stages:
        if parcel.verdict == VerdictType.BLOCKED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"State transition to '{new_stage.value}' REJECTED: Parcel evidence is BLOCKED (Confidence: {parcel.confidence_score}%). Verified field evidence required."
            )
        elif parcel.verdict in [VerdictType.WARNING, VerdictType.REVIEW]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"State transition to '{new_stage.value}' REJECTED: Parcel evidence is currently under {parcel.verdict.value} status ({parcel.confidence_score}% confidence). Must be VERIFIED."
            )

    parcel.current_stage = new_stage
    db.commit()
    db.refresh(parcel)

    # Log audit entry
    user_id = current_user.id if current_user else None
    audit_service.log_action(
        db=db,
        action=f"STAGE_CHANGE_{old_stage}_TO_{new_stage.value}",
        user_id=user_id,
        parcel_id=parcel.id,
        old_value={"stage": old_stage},
        new_value={"stage": new_stage.value},
        confidence_score=parcel.confidence_score
    )

    return parcel
