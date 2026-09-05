import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Enum, ForeignKey, Text, JSON, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OFFICER = "OFFICER"
    FIELD_OFFICER = "FIELD_OFFICER"
    PROJECT_AUTHORITY = "PROJECT_AUTHORITY"
    LANDOWNER = "LANDOWNER"
    AUDITOR = "AUDITOR"

class AcquisitionStage(str, enum.Enum):
    INITIAL = "INITIAL"
    NOTIFICATION = "NOTIFICATION"
    DECLARATION = "DECLARATION"
    AWARD = "AWARD"
    COMPENSATION = "COMPENSATION"
    POSSESSION_PENDING = "POSSESSION_PENDING"
    POSSESSION_VERIFIED = "POSSESSION_VERIFIED"
    COMPLETED = "COMPLETED"

class CompensationStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    DISPUTED = "DISPUTED"

class VerdictType(str, enum.Enum):
    VERIFIED = "VERIFIED"
    REVIEW = "REVIEW"
    WARNING = "WARNING"
    BLOCKED = "BLOCKED"

class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

def generate_uuid():
    return str(uuid.uuid4())

# Domain Models
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.FIELD_OFFICER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    corridors = relationship("Corridor", back_populates="project", cascade="all, delete-orphan")
    parcels = relationship("Parcel", back_populates="project", cascade="all, delete-orphan")

class Corridor(Base):
    __tablename__ = "corridors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    geometry = Column(JSON, nullable=False)  # GeoJSON MultiPolygon dict
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="corridors")
    parcels = relationship("Parcel", back_populates="corridor")

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parcel_code = Column(String(100), unique=True, nullable=False, index=True) # e.g. MH-NGP-0141
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    corridor_id = Column(String(36), ForeignKey("corridors.id", ondelete="SET NULL"), nullable=True)
    khasra_number = Column(String(100), nullable=False)
    landowner_name = Column(String(255), nullable=True)
    area_sqm = Column(Float, nullable=True)
    geometry = Column(JSON, nullable=False)  # GeoJSON Polygon dict
    centroid = Column(JSON, nullable=False)  # GeoJSON Point dict [lon, lat]
    current_stage = Column(Enum(AcquisitionStage), nullable=False, default=AcquisitionStage.INITIAL)
    compensation_status = Column(Enum(CompensationStatus), nullable=False, default=CompensationStatus.UNPAID)
    confidence_score = Column(Float, default=0.0)
    verdict = Column(Enum(VerdictType), default=VerdictType.REVIEW)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="parcels")
    corridor = relationship("Corridor", back_populates="parcels")
    field_captures = relationship("FieldCapture", back_populates="parcel", cascade="all, delete-orphan")
    attestations = relationship("Attestation", back_populates="parcel", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="parcel", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="parcel")

class FieldCapture(Base):
    __tablename__ = "field_captures"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parcel_id = Column(String(36), ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    captured_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    gps_accuracy = Column(Float, nullable=False) # meters
    location_point = Column(JSON, nullable=False) # GeoJSON Point [lon, lat]
    photo_url = Column(String(500), nullable=True)
    photo_hash = Column(String(64), nullable=False) # SHA-256
    device_id = Column(String(255), nullable=False)
    is_mock_location = Column(Boolean, default=False)
    play_integrity_verdict = Column(String(50), nullable=True)
    wifi_bssid = Column(String(100), nullable=True)
    cell_tower_id = Column(String(100), nullable=True)
    ble_beacon_id = Column(String(100), nullable=True)
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parcel = relationship("Parcel", back_populates="field_captures")
    attestation = relationship("Attestation", back_populates="capture", uselist=False, cascade="all, delete-orphan")

class Attestation(Base):
    __tablename__ = "attestations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    capture_id = Column(String(36), ForeignKey("field_captures.id", ondelete="CASCADE"), nullable=False)
    parcel_id = Column(String(36), ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False)
    pip_matched = Column(Boolean, nullable=False)
    haversine_distance_meters = Column(Float, nullable=False)
    signal_pip_score = Column(Float, nullable=False)      # 25%
    signal_device_score = Column(Float, nullable=False)   # 20%
    signal_network_score = Column(Float, nullable=False) # 15%
    signal_beacon_score = Column(Float, nullable=False)   # 20%
    signal_integrity_score = Column(Float, nullable=False)# 20%
    total_confidence_score = Column(Float, nullable=False)
    evidence_age_days = Column(Integer, default=0)
    final_verdict = Column(Enum(VerdictType), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    capture = relationship("FieldCapture", back_populates="attestation")
    parcel = relationship("Parcel", back_populates="attestations")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parcel_id = Column(String(36), ForeignKey("parcels.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(100), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False, default=AlertSeverity.HIGH)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parcel = relationship("Parcel", back_populates="alerts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    parcel_id = Column(String(36), ForeignKey("parcels.id"), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    evidence_hash = Column(String(64), nullable=True)
    confidence_score = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parcel = relationship("Parcel", back_populates="audit_logs")
