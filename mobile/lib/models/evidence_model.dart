class EvidenceCapture {
  final String? id;
  final String parcelId;
  final double latitude;
  final double longitude;
  final double gpsAccuracy;
  final String photoHash;
  final String deviceId;
  final bool isMockLocation;
  final String playIntegrityVerdict;
  final String? bleBeaconId;
  final String timestamp;
  final bool isSynced;

  EvidenceCapture({
    this.id,
    required this.parcelId,
    required this.latitude,
    required this.longitude,
    required this.gpsAccuracy,
    required this.photoHash,
    required this.deviceId,
    required this.isMockLocation,
    required this.playIntegrityVerdict,
    this.bleBeaconId,
    required this.timestamp,
    this.isSynced = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'parcel_id': parcelId,
      'latitude': latitude,
      'longitude': longitude,
      'gps_accuracy': gpsAccuracy,
      'photo_hash': photoHash,
      'device_id': deviceId,
      'is_mock_location': isMockLocation ? 1 : 0,
      'play_integrity_verdict': playIntegrityVerdict,
      'ble_beacon_id': bleBeaconId,
      'timestamp': timestamp,
      'is_synced': isSynced ? 1 : 0,
    };
  }

  factory EvidenceCapture.fromMap(Map<String, dynamic> map) {
    return EvidenceCapture(
      id: map['id']?.toString(),
      parcelId: map['parcel_id'],
      latitude: map['latitude'],
      longitude: map['longitude'],
      gpsAccuracy: map['gps_accuracy'],
      photoHash: map['photo_hash'],
      deviceId: map['device_id'],
      isMockLocation: map['is_mock_location'] == 1,
      playIntegrityVerdict: map['play_integrity_verdict'],
      bleBeaconId: map['ble_beacon_id'],
      timestamp: map['timestamp'],
      isSynced: map['is_synced'] == 1,
    );
  }

  Map<String, dynamic> toApiJson() {
    return {
      'parcel_id': parcelId,
      'latitude': latitude,
      'longitude': longitude,
      'gps_accuracy': gpsAccuracy,
      'photo_hash': photoHash,
      'device_id': deviceId,
      'is_mock_location': isMockLocation,
      'play_integrity_verdict': playIntegrityVerdict,
      'ble_beacon_id': bleBeaconId,
      'evidence_age_days': 0,
    };
  }
}
