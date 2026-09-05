import pytest
from fastapi.testclient import TestClient
from app.main import app
from seed_data import seed_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_seed():
    seed_db()

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_login():
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "field1@bhumisatya.gov.in", "password": "FieldPass123!"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert token is not None

def test_get_me_authenticated():
    # 1. Test with Admin account
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@bhumisatya.gov.in", "password": "AdminPass123!"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data["id"], str)
    assert len(data["id"]) > 0
    assert data["email"] == "admin@bhumisatya.gov.in"
    assert data["role"] == "ADMIN"
    assert data["is_active"] is True
    assert "created_at" in data

    # 2. Test with Field Officer account
    login_field = client.post(
        "/api/v1/auth/login",
        data={"username": "field1@bhumisatya.gov.in", "password": "FieldPass123!"}
    )
    assert login_field.status_code == 200
    field_token = login_field.json()["access_token"]

    res_field = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {field_token}"})
    assert res_field.status_code == 200
    data_field = res_field.json()
    assert isinstance(data_field["id"], str)
    assert len(data_field["id"]) > 0
    assert data_field["email"] == "field1@bhumisatya.gov.in"
    assert data_field["role"] == "FIELD_OFFICER"
    assert data_field["is_active"] is True

def test_get_me_with_uuid_instance():
    import uuid
    from datetime import datetime, timezone
    from app.models.domain import User, UserRole
    from app.auth.rbac import get_current_user

    test_uuid = uuid.uuid4()
    mock_user = User(
        email="uuid_test@bhumisatya.gov.in",
        hashed_password="hashed_pwd",
        full_name="UUID Test Officer",
        role=UserRole.ADMIN,
        is_active=True
    )
    mock_user.id = test_uuid
    mock_user.created_at = datetime.now(timezone.utc)

    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        res = client.get("/api/v1/auth/me")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data["id"], str)
        assert data["id"] == str(test_uuid)
        assert data["email"] == "uuid_test@bhumisatya.gov.in"
        assert data["role"] == "ADMIN"
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_get_me_invalid_token():
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert res.status_code == 401

def test_get_parcels():
    res = client.get("/api/v1/parcels")
    assert res.status_code == 200
    parcels = res.json()
    assert len(parcels) == 4
    codes = [p["parcel_code"] for p in parcels]
    assert "MH-NGP-0141" in codes
    assert "MH-NGP-0143" in codes

def test_get_blocked_parcel_details():
    res = client.get("/api/v1/parcels/MH-NGP-0143")
    assert res.status_code == 200
    parcel = res.json()
    assert parcel["verdict"] == "BLOCKED"
    assert parcel["confidence_score"] <= 40.0

def test_sensitive_stage_transition_rejected_when_blocked():
    # Attempt sensitive transition (POSSESSION_VERIFIED) on BLOCKED parcel MH-NGP-0143
    res = client.post(
        "/api/v1/parcels/MH-NGP-0143/stage",
        json={"target_stage": "POSSESSION_VERIFIED"}
    )
    assert res.status_code == 400
    assert "REJECTED" in res.json()["detail"]

def test_submit_evidence_simulator():
    # Submit valid evidence for MH-NGP-0142
    payload = {
        "parcel_id": "MH-NGP-0142",
        "latitude": 21.1465,
        "longitude": 79.0890,
        "gps_accuracy": 4.0,
        "photo_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "device_id": "SIMULATOR-TEST-01",
        "is_mock_location": False,
        "play_integrity_verdict": "MEETS_STRONG_INTEGRITY",
        "wifi_bssid": "WIFI-01",
        "cell_tower_id": "CELL-01",
        "ble_beacon_id": "BLE-BEACON-02",
        "evidence_age_days": 0
    }
    res = client.post("/api/v1/evidence", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] == "VERIFIED"
    assert data["confidence_score"] >= 90.0

def test_landowner_portal_query():
    res = client.get("/api/v1/landowner/parcel/MH-NGP-0141")
    assert res.status_code == 200
    data = res.json()
    assert data["parcel_code"] == "MH-NGP-0141"
    assert data["khasra_number"] == "112/1"
    assert data["verdict"] == "VERIFIED"
