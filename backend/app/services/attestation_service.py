import math
from typing import Dict, Any

class AttestationService:
    @staticmethod
    def calculate_confidence_score(
        pip_matched: bool,
        distance_meters: float,
        is_mock_location: bool,
        play_integrity: str,
        wifi_bssid: str = None,
        cell_tower_id: str = None,
        ble_beacon_id: str = None,
        photo_hash: str = None,
        evidence_age_days: int = 0,
        decay_lambda: float = 0.003
    ) -> Dict[str, Any]:
        """
        Calculates 5-signal evidence confidence score (0-100%) and decay.
        Weights:
        - PIP: 25%
        - Device: 20%
        - Network: 15%
        - Beacon: 20%
        - Hash/Integrity: 20%
        """
        # 1. PIP Signal (25%)
        if pip_matched:
            signal_pip = 100.0
        else:
            # Drop off rapidly with distance in meters
            signal_pip = max(0.0, 100.0 - (distance_meters / 50.0))

        # 2. Device Integrity (20%)
        if is_mock_location:
            signal_device = 0.0
        elif play_integrity == "MEETS_STRONG_INTEGRITY":
            signal_device = 100.0
        elif play_integrity == "MEETS_DEVICE_INTEGRITY":
            signal_device = 75.0
        else:
            signal_device = 20.0

        # 3. Network Signal (15%)
        has_wifi = bool(wifi_bssid and len(wifi_bssid) > 3)
        has_cell = bool(cell_tower_id and len(cell_tower_id) > 3)
        if has_wifi and has_cell:
            signal_network = 100.0
        elif has_wifi or has_cell:
            signal_network = 70.0
        else:
            signal_network = 30.0

        # 4. Beacon Signal (20%)
        if ble_beacon_id and len(ble_beacon_id) > 3:
            signal_beacon = 100.0
        else:
            signal_beacon = 0.0

        # 5. Hash / Evidence Integrity (20%)
        if photo_hash and len(photo_hash) == 64:
            signal_hash = 100.0
        else:
            signal_hash = 0.0

        # Weighted calculation
        raw_score = (
            (signal_pip * 0.25) +
            (signal_device * 0.20) +
            (signal_network * 0.15) +
            (signal_beacon * 0.20) +
            (signal_hash * 0.20)
        )

        # Apply Evidence Age Decay: initial * exp(-lambda * days)
        decay_factor = math.exp(-decay_lambda * max(0, evidence_age_days))
        final_confidence = round(raw_score * decay_factor, 2)

        return {
            "signal_pip_score": round(signal_pip, 2),
            "signal_device_score": round(signal_device, 2),
            "signal_network_score": round(signal_network, 2),
            "signal_beacon_score": round(signal_beacon, 2),
            "signal_integrity_score": round(signal_hash, 2),
            "raw_score": round(raw_score, 2),
            "decay_factor": round(decay_factor, 4),
            "evidence_age_days": evidence_age_days,
            "total_confidence_score": min(100.0, max(0.0, final_confidence))
        }

attestation_service = AttestationService()
