from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.domain import AuditLog, Alert, AlertSeverity

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        user_id: Optional[str] = None,
        parcel_id: Optional[str] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        evidence_hash: Optional[str] = None,
        confidence_score: Optional[float] = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            parcel_id=parcel_id,
            old_value=old_value,
            new_value=new_value,
            evidence_hash=evidence_hash,
            confidence_score=confidence_score
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @staticmethod
    def create_alert(
        db: Session,
        parcel_id: str,
        alert_type: str,
        title: str,
        message: str,
        severity: AlertSeverity = AlertSeverity.HIGH
    ) -> Alert:
        alert = Alert(
            parcel_id=parcel_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            is_resolved=False
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

audit_service = AuditService()
