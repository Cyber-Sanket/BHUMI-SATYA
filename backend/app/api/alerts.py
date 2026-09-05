from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Alert, AuditLog, User
from app.schemas.dto import AlertResponse, AuditLogResponse
from app.services.audit_service import audit_service
from app.auth.rbac import get_current_user

router = APIRouter(tags=["Alerts & Audit Engine"])

@router.get("/alerts", response_model=List[AlertResponse])
@router.get("/alerts/", response_model=List[AlertResponse])
def get_alerts(resolved: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if resolved is not None:
        query = query.filter(Alert.is_resolved == resolved)
    return query.order_by(Alert.created_at.desc()).all()

@router.patch("/alerts/{id}/resolve", response_model=AlertResponse)
def resolve_alert(
    id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    db.commit()
    db.refresh(alert)

    user_id = current_user.id if current_user else None
    audit_service.log_action(
        db=db,
        action="ALERT_RESOLVED",
        user_id=user_id,
        parcel_id=alert.parcel_id,
        new_value={"alert_id": alert.id, "title": alert.title}
    )

    return alert

@router.get("/audit-logs", response_model=List[AuditLogResponse])
@router.get("/audit-logs/", response_model=List[AuditLogResponse])
def get_audit_logs(parcel_id: Optional[str] = None, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(AuditLog)
    if parcel_id:
        query = query.filter(AuditLog.parcel_id == parcel_id)
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
