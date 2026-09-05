from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.domain import UserRole, AcquisitionStage, CompensationStatus, VerdictType, AlertSeverity

# Auth Schemas
class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: Optional[datetime] = None

    @field_validator("id", mode="before")
    @classmethod
    def serialize_id(cls, v: Any) -> str:
        if v is not None:
            return str(v)
        return ""

    class Config:
        from_attributes = True

# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    code: str
    state: str
    district: str

class ProjectResponse(BaseModel):
    id: str
    name: str
    code: str
    state: str
    district: str
    created_at: datetime

    @field_validator("id", mode="before")
    @classmethod
    def serialize_id(cls, v: Any) -> str:
        if v is not None:
            return str(v)
        return ""

    class Config:
        from_attributes = True

# Corridor Schemas
class CorridorResponse(BaseModel):
    id: str
    project_id: str
    name: str
    geometry: Dict[str, Any]
    created_at: datetime

    @field_validator("id", "project_id", mode="before")
    @classmethod
    def serialize_ids(cls, v: Any) -> str:
        if v is not None:
            return str(v)
        return ""

    class Config:
        from_attributes = True

# Parcel Schemas
class ParcelResponse(BaseModel):
    id: str
    parcel_code: str
    project_id: str
    corridor_id: Optional[str] = None
    khasra_number: str
    landowner_name: Optional[str] = None
    area_sqm: Optional[float] = None
    geometry: Dict[str, Any]
    centroid: Dict[str, Any]
    current_stage: AcquisitionStage
    compensation_status: CompensationStatus
    confidence_score: float
    verdict: VerdictType
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "project_id", "corridor_id", mode="before")
    @classmethod
    def serialize_ids(cls, v: Any) -> Optional[str]:
        if v is not None:
            return str(v)
        return None

    class Config:
        from_attributes = True

class ParcelStageUpdate(BaseModel):
    target_stage: AcquisitionStage

# Field Capture / Evidence Schemas
class FieldCaptureCreate(BaseModel):
    parcel_id: str
    latitude: float
    longitude: float
    gps_accuracy: float = 5.0
    photo_url: Optional[str] = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600"
    photo_hash: str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    device_id: str = "DEV-ANDROID-FIELD-01"
    is_mock_location: bool = False
    play_integrity_verdict: str = "MEETS_STRONG_INTEGRITY"
    wifi_bssid: Optional[str] = "AA:BB:CC:DD:EE:FF"
    cell_tower_id: Optional[str] = "CELL-NAGPUR-404-12"
    ble_beacon_id: Optional[str] = "BLE-BEACON-NGP-01"
    evidence_age_days: int = 0

class AttestationResponse(BaseModel):
    id: str
    capture_id: str
    parcel_id: str
    pip_matched: bool
    haversine_distance_meters: float
    signal_pip_score: float
    signal_device_score: float
    signal_network_score: float
    signal_beacon_score: float
    signal_integrity_score: float
    total_confidence_score: float
    evidence_age_days: int
    final_verdict: VerdictType
    created_at: datetime

    @field_validator("id", "capture_id", "parcel_id", mode="before")
    @classmethod
    def serialize_ids(cls, v: Any) -> str:
        if v is not None:
            return str(v)
        return ""

    class Config:
        from_attributes = True

class VerdictEvaluationResponse(BaseModel):
    parcel_id: str
    parcel_code: str
    confidence_score: float
    verdict: VerdictType
    attestation: AttestationResponse
    stage: AcquisitionStage
    compensation_status: CompensationStatus

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    parcel_id: str
    alert_type: str
    severity: AlertSeverity
    title: str
    message: str
    is_resolved: bool
    created_at: datetime

    @field_validator("id", "parcel_id", mode="before")
    @classmethod
    def serialize_ids(cls, v: Any) -> str:
        if v is not None:
            return str(v)
        return ""

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    parcel_id: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    evidence_hash: Optional[str] = None
    confidence_score: Optional[float] = None
    timestamp: datetime

    @field_validator("id", "user_id", "parcel_id", mode="before")
    @classmethod
    def serialize_ids(cls, v: Any) -> Optional[str]:
        if v is not None:
            return str(v)
        return None

    class Config:
        from_attributes = True

# Landowner Portal Response
class LandownerParcelResponse(BaseModel):
    parcel_code: str
    khasra_number: str
    landowner_name: Optional[str]
    area_sqm: Optional[float]
    current_stage: AcquisitionStage
    compensation_status: CompensationStatus
    confidence_score: float
    verdict: VerdictType
    latest_evidence_date: Optional[datetime]
    last_updated: datetime
