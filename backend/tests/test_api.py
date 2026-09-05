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
