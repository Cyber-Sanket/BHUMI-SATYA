import 'package:flutter/material.dart';
import 'capture_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BHUMI-SATYA Field App', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync, color: Color(0xFF10B981)),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Syncing offline queue with BHUMI-SATYA server...')),
              );
            },
          )
        ],
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
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: const Row(
                children: [
                  Icon(Icons.security, color: Color(0xFF10B981), size: 32),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Officer: Suresh Kumar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Nagpur Metro Corridor Sector 4', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('CORRIDOR PARCEL QUEUE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 12),
            Expanded(
              child: ListView(
                children: [
                  _buildParcelItem(context, 'MH-NGP-0141', 'Khasra 112/1', 'POSSESSION_VERIFIED', Colors.emerald),
                  _buildParcelItem(context, 'MH-NGP-0142', 'Khasra 112/2', 'AWARD', Colors.emerald),
                  _buildParcelItem(context, 'MH-NGP-0143', 'Khasra 113/1', 'POSSESSION_PENDING', Colors.red),
                  _buildParcelItem(context, 'MH-NGP-0144', 'Khasra 113/2', 'DECLARATION', Colors.amber),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildParcelItem(BuildContext context, String code, String khasra, String stage, Color color) {
    return Card(
      color: const Color(0xFF0F172A),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Colors.white10)),
      child: ListTile(
        title: Text(code, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('$khasra • Stage: $stage'),
        trailing: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black),
          icon: const Icon(Icons.camera_alt, size: 16),
          label: const Text('Capture'),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => CaptureScreen(parcelCode: code, khasra: khasra)),
            );
          },
        ),
      ),
    );
  }
}
