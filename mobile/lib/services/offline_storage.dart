import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/evidence_model.dart';

class OfflineStorageService {
  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final path = join(await getDatabasesPath(), 'bhumi_satya_offline.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE offline_queue (
            id TEXT PRIMARY KEY,
            parcel_id TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            gps_accuracy REAL NOT NULL,
            photo_hash TEXT NOT NULL,
            device_id TEXT NOT NULL,
            is_mock_location INTEGER NOT NULL,
            play_integrity_verdict TEXT NOT NULL,
            ble_beacon_id TEXT,
            timestamp TEXT NOT NULL,
            is_synced INTEGER NOT NULL DEFAULT 0
          )
        ''');
      },
    );
  }

  Future<void> saveCapture(EvidenceCapture capture) async {
    final db = await database;
    await db.insert('offline_queue', capture.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<EvidenceCapture>> getUnsyncedCaptures() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'offline_queue',
      where: 'is_synced = ?',
      whereArgs: [0],
    );
    return List.generate(maps.length, (i) => EvidenceCapture.fromMap(maps[i]));
  }

  Future<void> markAsSynced(String id) async {
    final db = await database;
    await db.update(
      'offline_queue',
      {'is_synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
