import pytest
from app.services.attestation_service import attestation_service
from app.services.verdict_service import verdict_service
from app.models.domain import VerdictType

def test_attestation_scoring_perfect():
    res = attestation_service.calculate_confidence_score(
        pip_matched=True,
        distance_meters=0.0,
        is_mock_location=False,
        play_integrity="MEETS_STRONG_INTEGRITY",
        wifi_bssid="AA:BB:CC:DD:EE:FF",
        cell_tower_id="CELL-404-12",
        ble_beacon_id="BLE-BEACON-01",
        photo_hash="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        evidence_age_days=0
    )
    assert res["total_confidence_score"] >= 95.0
    verdict = verdict_service.evaluate_verdict(res["total_confidence_score"])
    assert verdict == VerdictType.VERIFIED

def test_attestation_scoring_51km_mismatch_blocked():
    res = attestation_service.calculate_confidence_score(
        pip_matched=False,
        distance_meters=51000.0,
        is_mock_location=True, # Mock location flagged
        play_integrity="FAILED",
        wifi_bssid=None,
        cell_tower_id=None,
        ble_beacon_id=None,
        photo_hash="d8c3b7a1e2f49810398471209384719283741928374129384712938471293847",
        evidence_age_days=0
    )
    assert res["total_confidence_score"] < 40.0
    verdict = verdict_service.evaluate_verdict(res["total_confidence_score"])
    assert verdict == VerdictType.BLOCKED

def test_evidence_age_decay():
    res_day0 = attestation_service.calculate_confidence_score(
        pip_matched=True, distance_meters=0.0, is_mock_location=False,
        play_integrity="MEETS_STRONG_INTEGRITY", wifi_bssid="WIFI", cell_tower_id="CELL",
        ble_beacon_id="BEACON", photo_hash="a"*64, evidence_age_days=0
    )
    res_day90 = attestation_service.calculate_confidence_score(
        pip_matched=True, distance_meters=0.0, is_mock_location=False,
        play_integrity="MEETS_STRONG_INTEGRITY", wifi_bssid="WIFI", cell_tower_id="CELL",
        ble_beacon_id="BEACON", photo_hash="a"*64, evidence_age_days=90
    )
    assert res_day90["total_confidence_score"] < res_day0["total_confidence_score"]
