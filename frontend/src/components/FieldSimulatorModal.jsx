import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import apiService from '../services/api';

export default function FieldSimulatorModal({ isOpen, onClose, parcels = [], onEvidenceSubmitted }) {
  if (!isOpen) return null;

  const [selectedParcelCode, setSelectedParcelCode] = useState(parcels[0]?.parcel_code || 'MH-NGP-0143');
  const [latitude, setLatitude] = useState(21.1475);
  const [longitude, setLongitude] = useState(79.09015);
  const [gpsAccuracy, setGpsAccuracy] = useState(4.2);
  const [isMockLocation, setIsMockLocation] = useState(true);
  const [playIntegrity, setPlayIntegrity] = useState('FAILED');
  const [wifiBssid, setWifiBssid] = useState('AA:BB:CC:11:22:33');
  const [cellTowerId, setCellTowerId] = useState('CELL-404-12');
  const [bleBeaconId, setBleBeaconId] = useState('');
  const [evidenceAgeDays, setEvidenceAgeDays] = useState(0);
  const [photoHash, setPhotoHash] = useState('d8c3b7a1e2f49810398471209384719283741928374129384712938471293847');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Demo Presets
  const applyPresetValid = () => {
    setSelectedParcelCode('MH-NGP-0141');
    setLatitude(21.1455);
    setLongitude(79.08815);
    setGpsAccuracy(3.2);
    setIsMockLocation(false);
    setPlayIntegrity('MEETS_STRONG_INTEGRITY');
    setBleBeaconId('BLE-BEACON-NGP-01');
    setEvidenceAgeDays(0);
    setPhotoHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    setResult(null);
  };

  const applyPresetBlocked = () => {
    setSelectedParcelCode('MH-NGP-0143');
    setLatitude(20.6850);
    setLongitude(78.8500);
    setGpsAccuracy(48.0);
    setIsMockLocation(true);
    setPlayIntegrity('FAILED');
    setBleBeaconId('');
    setEvidenceAgeDays(0);
    setPhotoHash('d8c3b7a1e2f49810398471209384719283741928374129384712938471293847');
    setResult(null);
  };

  const applyPresetReview = () => {
    setSelectedParcelCode('MH-NGP-0144');
    setLatitude(21.1485);
    setLongitude(79.09115);
    setGpsAccuracy(8.5);
    setIsMockLocation(false);
    setPlayIntegrity('MEETS_DEVICE_INTEGRITY');
    setBleBeaconId('');
    setEvidenceAgeDays(65);
    setPhotoHash('f4a2b9c8d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        parcel_id: selectedParcelCode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        gps_accuracy: parseFloat(gpsAccuracy),
        device_id: 'SIMULATOR-SIH-2026-DEV',
        is_mock_location: isMockLocation,
        play_integrity_verdict: playIntegrity,
        wifi_bssid: wifiBssid || null,
        cell_tower_id: cellTowerId || null,
        ble_beacon_id: bleBeaconId || null,
        evidence_age_days: parseInt(evidenceAgeDays) || 0,
        photo_hash: photoHash,
        photo_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600'
      };

      const res = await apiService.submitEvidence(payload);
      setResult(res.data);
      if (onEvidenceSubmitted) {
        onEvidenceSubmitted(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit evidence capture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="inst-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col justify-between">
        {/* Header */}
        <div className="inst-panel-header">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold badge-verified">
              FORM-FE-01
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider theme-text-primary font-mono">
              FIELD EVIDENCE SUBMISSION FORM
            </h2>
          </div>
          <button onClick={onClose} className="theme-text-secondary hover:theme-text-primary font-bold">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 text-xs font-mono">
          {/* Preset Demo Scenarios */}
          <div className="p-2 theme-bg-secondary border theme-border rounded-[2px] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase theme-text-secondary">LOAD DEMO SCENARIO:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={applyPresetValid}
                className="px-2 py-0.5 theme-bg-surface border theme-border text-emerald-600 font-bold text-[10px] hover:opacity-80"
              >
                01 Valid (95%)
              </button>
              <button
                type="button"
                onClick={applyPresetBlocked}
                className="px-2 py-0.5 theme-bg-surface border theme-border text-red-600 font-bold text-[10px] hover:opacity-80"
              >
                02 51km Mismatch (BLOCKED)
              </button>
              <button
                type="button"
                onClick={applyPresetReview}
                className="px-2 py-0.5 theme-bg-surface border theme-border text-amber-600 font-bold text-[10px] hover:opacity-80"
              >
                03 Decay (REVIEW)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section 01 — PARCEL */}
            <div className="p-3 theme-bg-surface border theme-border space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary block border-b theme-border pb-1">
                SECTION 01 — PARCEL IDENTIFICATION
              </span>

              <div>
                <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">Target Parcel Code</label>
                <select
                  value={selectedParcelCode}
                  onChange={(e) => setSelectedParcelCode(e.target.value)}
                  className="w-full theme-bg-secondary border theme-border rounded-[2px] px-2 py-1 theme-text-primary font-mono text-xs focus:outline-none"
                >
                  {parcels.map((p) => (
                    <option key={p.id} value={p.parcel_code}>
                      {p.parcel_code} (Khasra {p.khasra_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 02 — LOCATION */}
            <div className="p-3 theme-bg-surface border theme-border space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary block border-b theme-border pb-1">
                SECTION 02 — LOCATION TELEMETRY
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full theme-bg-secondary border theme-border rounded-[2px] px-2 py-1 theme-text-primary font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full theme-bg-secondary border theme-border rounded-[2px] px-2 py-1 theme-text-primary font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">Accuracy (m)</label>
                  <input
                    type="number"
                    step="any"
                    value={gpsAccuracy}
                    onChange={(e) => setGpsAccuracy(e.target.value)}
                    className="w-full theme-bg-secondary border theme-border rounded-[2px] px-2 py-1 theme-text-primary font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 03 — DEVICE */}
            <div className="p-3 theme-bg-surface border theme-border space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary block border-b theme-border pb-1">
                SECTION 03 — DEVICE INTEGRITY & NETWORK
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">Play Integrity Verdict</label>
                  <select
                    value={playIntegrity}
                    onChange={(e) => setPlayIntegrity(e.target.value)}
                    className="w-full theme-bg-secondary border theme-border rounded-[2px] px-2 py-1 theme-text-primary font-mono text-xs focus:outline-none"
                  >
                    <option value="MEETS_STRONG_INTEGRITY">MEETS_STRONG_INTEGRITY</option>
                    <option value="MEETS_DEVICE_INTEGRITY">MEETS_DEVICE_INTEGRITY</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                <div>
                  <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">Mock Location Flag</label>
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={isMockLocation}
                        onChange={(e) => setIsMockLocation(e.target.checked)}
                        className="rounded border-slate-300 text-red-600"
                      />
                      <span className={isMockLocation ? 'text-red-600 font-bold' : 'theme-text-primary'}>
                        {isMockLocation ? 'MOCK LOCATION FLAGGED (TRUE)' : 'CLEAN (FALSE)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 04 — SITE VERIFICATION */}
            <div className="p-3 theme-bg-surface border theme-border space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider theme-text-secondary block border-b theme-border pb-1">
                SECTION 04 — SITE VERIFICATION TOKENS
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">BLE / QR Beacon ID</label>
                  <input
                    type="text"
                    placeholder="BLE-BEACON-NGP-01"
                    value={bleBeaconId}
                    onChange={(e) => setBleBeaconId(e.target.value)}
                    className="w-full theme-bg-secondary border theme-border rounded-[2px] px-2 py-1 theme-text-primary font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">Evidence Age Elapsed (Days)</label>
                  <input
                    type="number"
                    value={evidenceAgeDays}
                    onChange={(e) => setEvidenceAgeDays(e.target.value)}
                    className="w-full theme-bg-secondary border theme-border rounded-[2px] px-2 py-1 theme-text-primary font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block theme-text-secondary text-[10px] uppercase font-bold mb-1">Photo SHA-256 Hash</label>
                <input
                  type="text"
                  value={photoHash}
                  onChange={(e) => setPhotoHash(e.target.value)}
                  className="w-full theme-bg-secondary border theme-border rounded-[2px] px-2 py-1 theme-text-primary font-mono text-[10px] focus:outline-none"
                />
              </div>
            </div>

            {/* Section 05 — RESULT */}
            {result && (
              <div className="p-3 theme-bg-secondary border theme-border rounded-[2px] space-y-1">
                <span className="text-[10px] font-bold uppercase theme-text-secondary block">SECTION 05 — EVALUATION RESULT</span>
                <div className="flex justify-between font-bold text-xs">
                  <span>CONFIDENCE: <strong className="theme-text-primary">{result.confidence_score}%</strong></span>
                  <span>VERDICT: <strong className={result.verdict === 'VERIFIED' ? 'text-emerald-600' : 'text-red-600'}>{result.verdict}</strong></span>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t theme-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 theme-bg-secondary border theme-border theme-text-primary font-bold text-xs uppercase hover:opacity-80"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {loading ? 'Evaluating...' : 'SUBMIT EVIDENCE'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-2 badge-blocked font-mono text-xs">
              ERROR: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
