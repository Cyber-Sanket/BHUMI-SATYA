import 'package:flutter/material.dart';
import '../models/evidence_model.dart';
import '../services/offline_storage.dart';

class CaptureScreen extends StatefulWidget {
  final String parcelCode;
  final String khasra;

  const CaptureScreen({super.key, required this.parcelCode, required this.khasra});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  final _storage = OfflineStorageService();
  double lat = 21.1455;
  double lon = 79.08815;
  double accuracy = 3.5;
  bool isMockLocation = false;
  String playIntegrity = 'MEETS_STRONG_INTEGRITY';
  bool isSaving = false;

  void _saveEvidence() async {
    setState(() => isSaving = true);

    final capture = EvidenceCapture(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      parcelId: widget.parcelCode,
      latitude: lat,
      longitude: lon,
      gpsAccuracy: accuracy,
      photoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      deviceId: 'FLUTTER-FIELD-DEV-01',
      isMockLocation: isMockLocation,
      playIntegrityVerdict: playIntegrity,
      bleBeaconId: 'BLE-BEACON-NGP-01',
      timestamp: DateTime.now().toIso8601String(),
    );

    await _storage.saveCapture(capture);
    setState(() => isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Evidence queued for ${widget.parcelCode} (Offline DB)')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Capture Evidence: ${widget.parcelCode}'),
        backgroundColor: const Color(0xFF0F172A),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.parcelCode, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text(widget.khasra, style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('GPS: ${lat.toStringAsFixed(4)}, ${lon.toStringAsFixed(4)}'),
                      Text('Accuracy: ${accuracy}m', style: const TextStyle(color: Colors.emerald)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SwitchListTile(
              title: const Text('Simulate OS Mock Location Flag'),
              subtitle: const Text('Detects if fake GPS app is active on device'),
              value: isMockLocation,
              onChanged: (val) => setState(() => isMockLocation = val),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 50),
              ),
              icon: const Icon(Icons.cloud_upload),
              label: isSaving
                  ? const CircularProgressIndicator()
                  : const Text('SAVE & QUEUE EVIDENCE', style: TextStyle(fontWeight: FontWeight.bold)),
              onPressed: isSaving ? null : _saveEvidence,
            ),
          ],
        ),
      ),
    );
  }
}
