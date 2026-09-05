from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Parcel, FieldCapture
from app.schemas.dto import LandownerParcelResponse

router = APIRouter(prefix="/landowner", tags=["Landowner Portal"])

@router.get("/parcel/{parcel_code}", response_model=LandownerParcelResponse)
def get_landowner_parcel(parcel_code: str, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter(
        (Parcel.parcel_code.ilike(parcel_code)) | (Parcel.khasra_number.ilike(parcel_code))
    ).first()

    if not parcel:
        raise HTTPException(
            status_code=404,
            detail=f"No land acquisition record found for Khasra / Parcel Code '{parcel_code}'"
        )

    latest_capture = db.query(FieldCapture).filter(FieldCapture.parcel_id == parcel.id).order_by(FieldCapture.captured_at.desc()).first()
    latest_date = latest_capture.captured_at if latest_capture else None

    return {
        "parcel_code": parcel.parcel_code,
        "khasra_number": parcel.khasra_number,
        "landowner_name": parcel.landowner_name,
        "area_sqm": parcel.area_sqm,
        "current_stage": parcel.current_stage,
        "compensation_status": parcel.compensation_status,
        "confidence_score": parcel.confidence_score,
        "verdict": parcel.verdict,
        "latest_evidence_date": latest_date,
        "last_updated": parcel.updated_at
    }
