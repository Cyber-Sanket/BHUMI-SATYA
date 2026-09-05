from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Parcel, FieldCapture, Attestation, VerdictType, AlertSeverity, User
from app.schemas.dto import FieldCaptureCreate, VerdictEvaluationResponse, AttestationResponse
from app.services.gis_service import gis_service
from app.services.attestation_service import attestation_service
from app.services.verdict_service import verdict_service
from app.services.audit_service import audit_service
from app.auth.rbac import get_current_user

router = APIRouter(prefix="/evidence", tags=["Evidence & Attestation Engine"])

@router.post("", response_model=VerdictEvaluationResponse)
def submit_evidence(
    capture_in: FieldCaptureCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch target parcel
    parcel = db.query(Parcel).filter(
        (Parcel.id == capture_in.parcel_id) | (Parcel.parcel_code == capture_in.parcel_id)
    ).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Target parcel not found")

    # 1. Spatial validation
    gis_res = gis_service.validate_location(
        lat=capture_in.latitude,
        lon=capture_in.longitude,
        parcel_geometry=parcel.geometry,
        centroid_geometry=parcel.centroid
    )
    pip_matched = gis_res["pip_matched"]
    dist_meters = gis_res["haversine_distance_meters"]
    dist_km = gis_res["haversine_distance_km"]

    # 2. 5-Signal Attestation & Confidence Scoring
    attestation_res = attestation_service.calculate_confidence_score(
        pip_matched=pip_matched,
        distance_meters=dist_meters,
        is_mock_location=capture_in.is_mock_location,
        play_integrity=capture_in.play_integrity_verdict,
        wifi_bssid=capture_in.wifi_bssid,
        cell_tower_id=capture_in.cell_tower_id,
        ble_beacon_id=capture_in.ble_beacon_id,
        photo_hash=capture_in.photo_hash,
        evidence_age_days=capture_in.evidence_age_days
    )

    total_confidence = attestation_res["total_confidence_score"]
    
    # 3. Verdict Evaluation
    final_verdict = verdict_service.evaluate_verdict(total_confidence)

    # 4. Save Field Capture Record
    location_point = {
        "type": "Point",
        "coordinates": [capture_in.longitude, capture_in.latitude]
    }
    officer_id = current_user.id if current_user else None

    capture = FieldCapture(
        parcel_id=parcel.id,
        officer_id=officer_id,
        latitude=capture_in.latitude,
        longitude=capture_in.longitude,
        gps_accuracy=capture_in.gps_accuracy,
        location_point=location_point,
        photo_url=capture_in.photo_url,
        photo_hash=capture_in.photo_hash,
        device_id=capture_in.device_id,
        is_mock_location=capture_in.is_mock_location,
        play_integrity_verdict=capture_in.play_integrity_verdict,
        wifi_bssid=capture_in.wifi_bssid,
        cell_tower_id=capture_in.cell_tower_id,
        ble_beacon_id=capture_in.ble_beacon_id
    )
    db.add(capture)
    db.commit()
    db.refresh(capture)

    # 5. Save Attestation Record
    attestation = Attestation(
        capture_id=capture.id,
        parcel_id=parcel.id,
        pip_matched=pip_matched,
        haversine_distance_meters=dist_meters,
        signal_pip_score=attestation_res["signal_pip_score"],
        signal_device_score=attestation_res["signal_device_score"],
        signal_network_score=attestation_res["signal_network_score"],
        signal_beacon_score=attestation_res["signal_beacon_score"],
        signal_integrity_score=attestation_res["signal_integrity_score"],
        total_confidence_score=total_confidence,
        evidence_age_days=capture_in.evidence_age_days,
        final_verdict=final_verdict
    )
    db.add(attestation)

    # 6. Update Parcel Digital Twin State
    old_verdict = parcel.verdict.value if parcel.verdict else "UNKNOWN"
    parcel.confidence_score = total_confidence
    parcel.verdict = final_verdict
    db.commit()
    db.refresh(parcel)

    # 7. Generate Alert if Mismatch or BLOCKED
    if final_verdict == VerdictType.BLOCKED or dist_meters > 500.0 or capture_in.is_mock_location:
        alert_title = "POSSESSION MISMATCH"
        severity = AlertSeverity.HIGH if final_verdict == VerdictType.BLOCKED else AlertSeverity.MEDIUM
        alert_msg = (
            f"⚠️ POSSESSION MISMATCH flagged for Parcel {parcel.parcel_code} (Khasra {parcel.khasra_number}). "
            f"Government Record stage: '{parcel.current_stage.value}'. Field evidence capture is at "
            f"wrong location (~{dist_km} km distance mismatch from parcel centroid). "
            f"Mock location: {capture_in.is_mock_location}. Confidence: {total_confidence}%. Final Verdict: {final_verdict.value}."
        )
        audit_service.create_alert(
            db=db,
            parcel_id=parcel.id,
            alert_type="GPS_MISMATCH",
            severity=severity,
            title=alert_title,
            message=alert_msg
        )

    # 8. Append-Only Audit Trail
    audit_service.log_action(
        db=db,
        action="EVIDENCE_CAPTURED_EVALUATED",
        user_id=officer_id,
        parcel_id=parcel.id,
        old_value={"verdict": old_verdict, "confidence": parcel.confidence_score},
        new_value={"verdict": final_verdict.value, "confidence": total_confidence, "pip_matched": pip_matched, "dist_km": dist_km},
        evidence_hash=capture_in.photo_hash,
        confidence_score=total_confidence
    )

    return {
        "parcel_id": parcel.id,
        "parcel_code": parcel.parcel_code,
        "confidence_score": total_confidence,
        "verdict": final_verdict,
        "attestation": attestation,
        "stage": parcel.current_stage,
        "compensation_status": parcel.compensation_status
    }

@router.get("/{parcel_id}")
def get_parcel_evidence(parcel_id: str, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter((Parcel.id == parcel_id) | (Parcel.parcel_code == parcel_id)).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    
    captures = db.query(FieldCapture).filter(FieldCapture.parcel_id == parcel.id).order_by(FieldCapture.captured_at.desc()).all()
    attestations = db.query(Attestation).filter(Attestation.parcel_id == parcel.id).order_by(Attestation.created_at.desc()).all()

    return {
        "parcel_id": parcel.id,
        "parcel_code": parcel.parcel_code,
        "captures": captures,
        "attestations": attestations
    }

@router.post("/evaluate/{parcel_id}", response_model=VerdictEvaluationResponse)
def evaluate_parcel_verdict(parcel_id: str, db: Session = Depends(get_db)):
    parcel = db.query(Parcel).filter((Parcel.id == parcel_id) | (Parcel.parcel_code == parcel_id)).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    latest_attestation = db.query(Attestation).filter(Attestation.parcel_id == parcel.id).order_by(Attestation.created_at.desc()).first()
    
    if not latest_attestation:
        raise HTTPException(status_code=400, detail="No field evidence captured yet for this parcel")

    return {
        "parcel_id": parcel.id,
        "parcel_code": parcel.parcel_code,
        "confidence_score": parcel.confidence_score,
        "verdict": parcel.verdict,
        "attestation": latest_attestation,
        "stage": parcel.current_stage,
        "compensation_status": parcel.compensation_status
    }
