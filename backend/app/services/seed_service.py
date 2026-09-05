import os
from sqlalchemy.orm import Session
from app.models.domain import (
    User, UserRole, Project, Corridor, Parcel, FieldCapture,
    Attestation, Alert, AlertSeverity, AuditLog, AcquisitionStage,
    CompensationStatus, VerdictType
)
from app.utils.security import get_password_hash

def seed_initial_data_if_needed(db: Session) -> dict:
    """
    Safely and idempotently ensures demo users and initial demo parcels exist.
    DOES NOT delete or overwrite any existing records.
    """
    created_users = []
    created_parcels = []

    # 1. Ensure Demo Users
    admin_user = db.query(User).filter(User.email == "admin@bhumisatya.gov.in").first()
    if not admin_user:
        admin_user = User(
            email="admin@bhumisatya.gov.in",
            hashed_password=get_password_hash("AdminPass123!"),
            full_name="Dr. Alok Verma (Project Director)",
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        created_users.append("admin@bhumisatya.gov.in")

    field_officer = db.query(User).filter(User.email == "field1@bhumisatya.gov.in").first()
    if not field_officer:
        field_officer = User(
            email="field1@bhumisatya.gov.in",
            hashed_password=get_password_hash("FieldPass123!"),
            full_name="Suresh Kumar (Field Surveyor)",
            role=UserRole.FIELD_OFFICER
        )
        db.add(field_officer)
        db.commit()
        db.refresh(field_officer)
        created_users.append("field1@bhumisatya.gov.in")

    # 2. Ensure Project, Corridor, and 4 Demo Parcels ONLY IF no parcels exist
    existing_parcels_count = db.query(Parcel).count()
    if existing_parcels_count == 0:
        # Check or create Project
        project = db.query(Project).filter(Project.code == "PRJ-NGP-METRO-02").first()
        if not project:
            project = Project(
                name="Nagpur Metro Phase 2 Rail Corridor",
                code="PRJ-NGP-METRO-02",
                state="Maharashtra",
                district="Nagpur"
            )
            db.add(project)
            db.commit()
            db.refresh(project)

        # Check or create Corridor
        corridor = db.query(Corridor).filter(Corridor.project_id == project.id).first()
        if not corridor:
            corridor_geom = {
                "type": "MultiPolygon",
                "coordinates": [[
                    [
                        [79.0850, 21.1440],
                        [79.0930, 21.1440],
                        [79.0930, 21.1500],
                        [79.0850, 21.1500],
                        [79.0850, 21.1440]
                    ]
                ]]
            }
            corridor = Corridor(
                project_id=project.id,
                name="North-South Alignment Sector 4",
                geometry=corridor_geom
            )
            db.add(corridor)
            db.commit()
            db.refresh(corridor)

        # Geometries for 4 Nagpur Parcels
        p1_geom = {
            "type": "Polygon",
            "coordinates": [[[79.0875, 21.1450], [79.0888, 21.1450], [79.0888, 21.1460], [79.0875, 21.1460], [79.0875, 21.1450]]]
        }
        p1_cent = {"type": "Point", "coordinates": [79.08815, 21.1455]}

        p2_geom = {
            "type": "Polygon",
            "coordinates": [[[79.0885, 21.1460], [79.0898, 21.1460], [79.0898, 21.1470], [79.0885, 21.1470], [79.0885, 21.1460]]]
        }
        p2_cent = {"type": "Point", "coordinates": [79.08915, 21.1465]}

        p3_geom = {
            "type": "Polygon",
            "coordinates": [[[79.0895, 21.1470], [79.0908, 21.1470], [79.0908, 21.1480], [79.0895, 21.1480], [79.0895, 21.1470]]]
        }
        p3_cent = {"type": "Point", "coordinates": [79.09015, 21.1475]}

        p4_geom = {
            "type": "Polygon",
            "coordinates": [[[79.0905, 21.1480], [79.0918, 21.1480], [79.0918, 21.1490], [79.0905, 21.1490], [79.0905, 21.1480]]]
        }
        p4_cent = {"type": "Point", "coordinates": [79.09115, 21.1485]}

        p1 = Parcel(
            parcel_code="MH-NGP-0141",
            project_id=project.id,
            corridor_id=corridor.id,
            khasra_number="112/1",
            landowner_name="Rajesh Sharma",
            area_sqm=1450.5,
            geometry=p1_geom,
            centroid=p1_cent,
            current_stage=AcquisitionStage.POSSESSION_VERIFIED,
            compensation_status=CompensationStatus.PAID,
            confidence_score=95.0,
            verdict=VerdictType.VERIFIED
        )
        p2 = Parcel(
            parcel_code="MH-NGP-0142",
            project_id=project.id,
            corridor_id=corridor.id,
            khasra_number="112/2",
            landowner_name="Sunita Deshmukh",
            area_sqm=2100.0,
            geometry=p2_geom,
            centroid=p2_cent,
            current_stage=AcquisitionStage.AWARD,
            compensation_status=CompensationStatus.PAID,
            confidence_score=92.5,
            verdict=VerdictType.VERIFIED
        )
        p3 = Parcel(
            parcel_code="MH-NGP-0143",
            project_id=project.id,
            corridor_id=corridor.id,
            khasra_number="113/1",
            landowner_name="Amitav Verma",
            area_sqm=1890.2,
            geometry=p3_geom,
            centroid=p3_cent,
            current_stage=AcquisitionStage.POSSESSION_PENDING,
            compensation_status=CompensationStatus.PAID,
            confidence_score=36.0,
            verdict=VerdictType.BLOCKED
        )
        p4 = Parcel(
            parcel_code="MH-NGP-0144",
            project_id=project.id,
            corridor_id=corridor.id,
            khasra_number="113/2",
            landowner_name="Priya Kulkarni",
            area_sqm=1620.8,
            geometry=p4_geom,
            centroid=p4_cent,
            current_stage=AcquisitionStage.DECLARATION,
            compensation_status=CompensationStatus.PARTIAL,
            confidence_score=74.5,
            verdict=VerdictType.REVIEW
        )

        db.add_all([p1, p2, p3, p4])
        db.commit()

        for p in [p1, p2, p3, p4]:
            db.refresh(p)
            created_parcels.append(p.parcel_code)

        # Seed captures & attestations for p1 and p3
        c1 = FieldCapture(
            parcel_id=p1.id,
            officer_id=field_officer.id,
            latitude=21.1455,
            longitude=79.08815,
            gps_accuracy=3.5,
            location_point={"type": "Point", "coordinates": [79.08815, 21.1455]},
            photo_url="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600",
            photo_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            device_id="DEV-FIELD-NGP-01",
            is_mock_location=False,
            play_integrity_verdict="MEETS_STRONG_INTEGRITY",
            wifi_bssid="44:FE:3B:11:22:33",
            cell_tower_id="CELL-404-12-88",
            ble_beacon_id="BLE-BEACON-NGP-01"
        )
        db.add(c1)
        db.commit()
        db.refresh(c1)

        att1 = Attestation(
            capture_id=c1.id,
            parcel_id=p1.id,
            pip_matched=True,
            haversine_distance_meters=0.0,
            signal_pip_score=100.0,
            signal_device_score=100.0,
            signal_network_score=100.0,
            signal_beacon_score=100.0,
            signal_integrity_score=100.0,
            total_confidence_score=95.0,
            evidence_age_days=2,
            final_verdict=VerdictType.VERIFIED
        )
        db.add(att1)

        c3 = FieldCapture(
            parcel_id=p3.id,
            officer_id=field_officer.id,
            latitude=20.6850,
            longitude=78.8500,
            gps_accuracy=42.0,
            location_point={"type": "Point", "coordinates": [78.8500, 20.6850]},
            photo_url="https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=600",
            photo_hash="d8c3b7a1e2f49810398471209384719283741928374129384712938471293847",
            device_id="DEV-FIELD-NGP-03",
            is_mock_location=True,
            play_integrity_verdict="FAILED",
            wifi_bssid=None,
            cell_tower_id=None,
            ble_beacon_id=None
        )
        db.add(c3)
        db.commit()
        db.refresh(c3)

        att3 = Attestation(
            capture_id=c3.id,
            parcel_id=p3.id,
            pip_matched=False,
            haversine_distance_meters=51200.0,
            signal_pip_score=0.0,
            signal_device_score=0.0,
            signal_network_score=30.0,
            signal_beacon_score=0.0,
            signal_integrity_score=100.0,
            total_confidence_score=36.0,
            evidence_age_days=0,
            final_verdict=VerdictType.BLOCKED
        )
        db.add(att3)

        alert3 = Alert(
            parcel_id=p3.id,
            alert_type="GPS_MISMATCH",
            severity=AlertSeverity.HIGH,
            title="POSSESSION MISMATCH",
            message=(
                "⚠️ POSSESSION MISMATCH flagged for Parcel MH-NGP-0143 (Khasra 113/1).\n"
                "Government Record: Possession Pending / Claimed Taken.\n"
                "Field Evidence: Submitted at wrong location (~51 km distance mismatch from parcel centroid).\n"
                "Mock Location Flag: DETECTED (TRUE).\n"
                "Confidence Score: 36.0%.\n"
                "Verdict: BLOCKED."
            ),
            is_resolved=False
        )
        db.add(alert3)

        audit1 = AuditLog(
            user_id=field_officer.id,
            action="POSSESSION_VERIFIED",
            parcel_id=p1.id,
            old_value={"stage": "POSSESSION_PENDING"},
            new_value={"stage": "POSSESSION_VERIFIED"},
            evidence_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            confidence_score=95.0
        )
        audit3 = AuditLog(
            user_id=field_officer.id,
            action="EVIDENCE_SUBMISSION_REJECTED_BLOCKED",
            parcel_id=p3.id,
            old_value={"verdict": "REVIEW"},
            new_value={"verdict": "BLOCKED", "reason": "51km GPS Mismatch + Mock Location"},
            evidence_hash="d8c3b7a1e2f49810398471209384719283741928374129384712938471293847",
            confidence_score=36.0
        )
        db.add_all([audit1, alert3, audit3])
        db.commit()

    return {
        "created_users": created_users,
        "created_parcels": created_parcels,
        "existing_parcels_kept": existing_parcels_count
    }
