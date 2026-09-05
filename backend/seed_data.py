import os
import sys
from datetime import datetime, timezone

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.domain import (
    User, UserRole, Project, Corridor, Parcel, FieldCapture,
    Attestation, Alert, AlertSeverity, AuditLog, AcquisitionStage,
    CompensationStatus, VerdictType
)
from app.utils.security import get_password_hash

def seed_db():
    print("[*] Initializing DB schema and seeding SIH 2026 Nagpur demo dataset...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Clean existing records if any
        db.query(AuditLog).delete()
        db.query(Alert).delete()
        db.query(Attestation).delete()
        db.query(FieldCapture).delete()
        db.query(Parcel).delete()
        db.query(Corridor).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.commit()

        # 2. Users
        admin_user = User(
            email="admin@bhumisatya.gov.in",
            hashed_password=get_password_hash("AdminPass123!"),
            full_name="Dr. Alok Verma (Project Director)",
            role=UserRole.ADMIN
        )
        field_officer = User(
            email="field1@bhumisatya.gov.in",
            hashed_password=get_password_hash("FieldPass123!"),
            full_name="Suresh Kumar (Field Surveyor)",
            role=UserRole.FIELD_OFFICER
        )
        db.add(admin_user)
        db.add(field_officer)
        db.commit()
        db.refresh(field_officer)

        # 3. Project: Nagpur Metro Phase 2 Land Corridor
        project = Project(
            name="Nagpur Metro Phase 2 Rail Corridor",
            code="PRJ-NGP-METRO-02",
            state="Maharashtra",
            district="Nagpur"
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # 4. Corridor MultiPolygon
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

        # 5. Geometries for 4 Nagpur Parcels
        # Parcel 1: MH-NGP-0141 [21.1450 to 21.1460, 79.0875 to 79.0888]
        p1_geom = {
            "type": "Polygon",
            "coordinates": [[
                [79.0875, 21.1450],
                [79.0888, 21.1450],
                [79.0888, 21.1460],
                [79.0875, 21.1460],
                [79.0875, 21.1450]
            ]]
        }
        p1_cent = {"type": "Point", "coordinates": [79.08815, 21.1455]}

        # Parcel 2: MH-NGP-0142 [21.1460 to 21.1470, 79.0885 to 79.0898]
        p2_geom = {
            "type": "Polygon",
            "coordinates": [[
                [79.0885, 21.1460],
                [79.0898, 21.1460],
                [79.0898, 21.1470],
                [79.0885, 21.1470],
                [79.0885, 21.1460]
            ]]
        }
        p2_cent = {"type": "Point", "coordinates": [79.08915, 21.1465]}

        # Parcel 3: MH-NGP-0143 [21.1470 to 21.1480, 79.0895 to 79.0908]
        p3_geom = {
            "type": "Polygon",
            "coordinates": [[
                [79.0895, 21.1470],
                [79.0908, 21.1470],
                [79.0908, 21.1480],
                [79.0895, 21.1480],
                [79.0895, 21.1470]
            ]]
        }
        p3_cent = {"type": "Point", "coordinates": [79.09015, 21.1475]}

        # Parcel 4: MH-NGP-0144 [21.1480 to 21.1490, 79.0905 to 79.0918]
        p4_geom = {
            "type": "Polygon",
            "coordinates": [[
                [79.0905, 21.1480],
                [79.0918, 21.1480],
                [79.0918, 21.1490],
                [79.0905, 21.1490],
                [79.0905, 21.1480]
            ]]
        }
        p4_cent = {"type": "Point", "coordinates": [79.09115, 21.1485]}

        # Create Parcels
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

        # 6. Field Captures & Attestations
        # Parcel 1 Capture
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

        # Parcel 3 Mismatch Capture (51 km away!)
        c3 = FieldCapture(
            parcel_id=p3.id,
            officer_id=field_officer.id,
            latitude=20.6850, # 51 km south-west in Wardha district!
            longitude=78.8500,
            gps_accuracy=42.0,
            location_point={"type": "Point", "coordinates": [78.8500, 20.6850]},
            photo_url="https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=600",
            photo_hash="d8c3b7a1e2f49810398471209384719283741928374129384712938471293847",
            device_id="DEV-FIELD-NGP-03",
            is_mock_location=True, # Mock location flagged!
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

        # 7. Create Required SIH Alert for Parcel 3
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

        # 8. Audit Log Entries
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
        db.add_all([audit1, audit3])
        db.commit()

        print("[+] SIH 2026 Nagpur demo dataset successfully seeded!")
        print("   - Parcel 1 (MH-NGP-0141): VERIFIED (95.0%)")
        print("   - Parcel 2 (MH-NGP-0142): VERIFIED (92.5%)")
        print("   - Parcel 3 (MH-NGP-0143): BLOCKED (36.0% - 51km Mismatch Alert)")
        print("   - Parcel 4 (MH-NGP-0144): REVIEW (74.5% - Decayed / Missing Beacon)")

    except Exception as e:
        db.rollback()
        print(f"[-] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
