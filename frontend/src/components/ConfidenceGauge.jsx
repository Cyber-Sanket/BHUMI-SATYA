import React from 'react';
import { getVerdictBadgeClass } from '../services/mapUtils';

export default function ConfidenceGauge({ score = 0, verdict = 'REVIEW', attestation = null }) {
  const getScoreColor = (val) => {
    if (val >= 90) return 'text-emerald-600';
    if (val >= 70) return 'text-amber-600';
    if (val >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const signals = [
    {
      name: 'PIP (Point-in-Polygon)',
      weight: '25%',
      score: attestation ? attestation.signal_pip_score : (score >= 90 ? 100 : (score < 40 ? 0 : 75)),
      details: attestation ? (attestation.pip_matched ? 'INSIDE PARCEL POLYGON' : `OUTSIDE BOUNDARY (~${attestation.haversine_distance_meters}m)`) : 'Spatial PIP Check'
    },
    {
      name: 'DEVICE (OS & Integrity)',
      weight: '20%',
      score: attestation ? attestation.signal_device_score : (score < 40 ? 0 : 100),
      details: attestation ? (attestation.signal_device_score === 0 ? 'MOCK LOCATION DETECTED' : 'Strong Play Integrity') : 'Play Integrity Check'
    },
    {
      name: 'NETWORK (Cell + Wi-Fi)',
      weight: '15%',
      score: attestation ? attestation.signal_network_score : 100,
      details: 'Cell Tower + Wi-Fi BSSID'
    },
    {
      name: 'BEACON (BLE Token)',
      weight: '20%',
      score: attestation ? attestation.signal_beacon_score : (verdict === 'REVIEW' ? 0 : 100),
      details: attestation ? (attestation.signal_beacon_score > 0 ? 'Verified Beacon Token' : 'Beacon Token Missing') : 'Beacon Token'
    },
    {
      name: 'HASH (SHA-256 Photo)',
      weight: '20%',
      score: attestation ? attestation.signal_integrity_score : 100,
      details: 'Cryptographic SHA-256 Hash'
    }
  ];

  return (
    <div className="inst-panel">
      <div className="inst-panel-header">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider theme-text-secondary">
          05 CONFIDENCE BREAKDOWN
        </span>
        <div className="flex items-center gap-2 font-mono">
          <span className="theme-text-secondary font-sans text-xs uppercase font-bold">FINAL CONFIDENCE:</span>
          <span className={`text-sm font-bold ${getScoreColor(score)}`}>
            {score.toFixed(1)}%
          </span>
          <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold ${getVerdictBadgeClass(verdict)}`}>
            {verdict}
          </span>
        </div>
      </div>

      <div className="p-2.5 space-y-2">
        <table className="cadastral-table">
          <thead>
            <tr>
              <th>Signal</th>
              <th>Weight</th>
              <th>Score</th>
              <th>Evaluation Detail</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((sig, idx) => {
              const sigColor = sig.score >= 90 ? 'text-emerald-600' : (sig.score > 0 ? 'text-amber-600' : 'text-red-600');
              return (
                <tr key={idx}>
                  <td className="font-mono font-semibold theme-text-primary">{sig.name}</td>
                  <td className="font-mono theme-text-secondary">{sig.weight}</td>
                  <td className={`font-mono font-bold ${sigColor}`}>{Math.round(sig.score)}%</td>
                  <td className="font-mono text-[11px] theme-text-secondary">{sig.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {attestation && attestation.evidence_age_days > 0 && (
          <div className="p-1.5 badge-review text-[10px] font-mono rounded-[2px]">
            EVIDENCE AGE DECAY: -{attestation.evidence_age_days} days elapsed decay applied
          </div>
        )}
      </div>
    </div>
  );
}
