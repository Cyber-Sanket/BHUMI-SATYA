import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import ConfidenceGauge from '../components/ConfidenceGauge';
import AuditTimeline from '../components/AuditTimeline';
import { getVerdictBadgeClass } from '../services/mapUtils';
import { ArrowLeft } from 'lucide-react';

const STAGES_ORDER = [
  'INITIAL',
  'NOTIFICATION',
  'DECLARATION',
  'AWARD',
  'COMPENSATION',
  'POSSESSION_PENDING',
  'POSSESSION_VERIFIED',
  'COMPLETED'
];

export default function ParcelDetail({ parcel: propParcel, onBack }) {
  const [parcel, setParcel] = useState(propParcel || null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (parcel) {
      loadParcelDetails(parcel.id || parcel.parcel_code);
    }
  }, [parcel?.id]);

  const loadParcelDetails = async (id) => {
    try {
      setLoading(true);
      const [parcelRes, evidenceRes, auditRes] = await Promise.all([
        apiService.getParcel(id),
        apiService.getParcelEvidence(id),
        apiService.getAuditLogs(id)
      ]);
      setParcel(parcelRes.data);
      setEvidenceData(evidenceRes.data);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Error loading parcel details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageTransition = async (newStage) => {
    setStageUpdating(true);
    setFeedback(null);
    try {
      const res = await apiService.updateParcelStage(parcel.id, newStage);
      setParcel(res.data);
      setFeedback({ type: 'success', message: `Stage updated to '${newStage}'` });
      loadParcelDetails(parcel.id);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update stage';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setStageUpdating(false);
    }
  };

  if (!parcel) {
    return (
      <div className="p-5 text-center font-mono theme-text-secondary">
        <p>NO PARCEL RECORD SELECTED.</p>
        <button onClick={onBack} className="mt-3 px-3 py-1 theme-bg-secondary theme-border theme-text-primary font-bold text-xs uppercase border">
          RETURN TO DASHBOARD
        </button>
      </div>
    );
  }

  const currentStageIndex = STAGES_ORDER.indexOf(parcel.current_stage);
  const latestCapture = evidenceData?.captures?.[0];
  const latestAttestation = evidenceData?.attestations?.[0];

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5 theme-text-primary select-none font-sans">
      
      {/* Navigation & Header Telemetry */}
      <div className="flex items-center justify-between border-b theme-border pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1 theme-bg-surface border theme-border theme-text-primary text-xs font-mono font-bold hover:theme-bg-secondary transition-colors rounded-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> BACK TO DASHBOARD
        </button>

        <div className="font-mono text-xs theme-text-secondary space-x-3">
          <span>PARCEL ID: <strong className="theme-text-primary">{parcel.id}</strong></span>
          <span>RECORD TYPE: <strong className="theme-text-primary">CADASTRAL DIGITAL TWIN</strong></span>
        </div>
      </div>

      {/* PARCEL RECORD HEADER BAR */}
      <div className="inst-panel p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b theme-border pb-3">
          <div>
            <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block">OFFICIAL INSPECTION RECORD</span>
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold font-mono theme-text-primary">{parcel.parcel_code}</h1>
              <span className="font-mono text-xs font-bold theme-text-primary theme-bg-secondary border theme-border px-2 py-0.5">
                KHASRA {parcel.khasra_number}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono">
            <div className="text-right">
              <span className="text-[10px] theme-text-secondary uppercase block font-sans">VERDICT</span>
              <span className={`px-2.5 py-0.5 rounded-sm text-xs font-bold ${getVerdictBadgeClass(parcel.verdict)}`}>
                {parcel.verdict}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] theme-text-secondary uppercase block font-sans">CONFIDENCE</span>
              <span className="text-base font-bold theme-text-primary">{parcel.confidence_score}%</span>
            </div>
          </div>
        </div>

        {/* STAGE TRANSITION STEPPER */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[10px] font-mono theme-text-secondary uppercase font-bold">
            <span>STATUTORY STAGE PROGRESSION (RFCTLARR ACT)</span>
            <span>CURRENT: {parcel.current_stage}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 font-mono text-[10px]">
            {STAGES_ORDER.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stage}
                  className={`p-1.5 border text-center ${
                    isCurrent
                      ? 'theme-bg-secondary theme-text-primary font-bold border-emerald-600'
                      : (isPast ? 'theme-bg-surface theme-border theme-text-primary' : 'theme-bg-app theme-border theme-text-secondary opacity-60')
                  }`}
                >
                  <div className="text-[8px] theme-text-secondary font-bold">{idx + 1}</div>
                  <div className="truncate font-semibold">{stage.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        </div>

        {feedback && (
          <div className={`p-2 font-mono text-xs border ${feedback.type === 'success' ? 'badge-verified' : 'badge-blocked'}`}>
            {feedback.message}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t theme-border font-mono text-xs">
          <span className="theme-text-secondary">STAGE ACTION:</span>
          {STAGES_ORDER[currentStageIndex + 1] && (
            <button
              onClick={() => handleStageTransition(STAGES_ORDER[currentStageIndex + 1])}
              disabled={stageUpdating}
              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold uppercase text-[11px] disabled:opacity-50 transition-colors rounded-sm"
            >
              ADVANCE STAGE TO '{STAGES_ORDER[currentStageIndex + 1]}'
            </button>
          )}
        </div>
      </div>

      {/* STRUCTURED SECTIONS: PROPERTY & STATUTORY STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* PROPERTY SECTION */}
        <div className="inst-panel p-4 space-y-3 font-mono">
          <div className="border-b theme-border pb-1.5 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">PROPERTY DETAILS</h2>
            <span className="text-[10px] theme-text-secondary">REV DEPT RECORD</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b theme-border pb-1">
              <span className="theme-text-secondary uppercase">LANDOWNER NAME</span>
              <span className="font-bold theme-text-primary">{parcel.landowner_name}</span>
            </div>
            <div className="flex justify-between border-b theme-border pb-1">
              <span className="theme-text-secondary uppercase">TOTAL AREA</span>
              <span className="font-bold theme-text-primary">{parcel.area_sqm} SQ.M</span>
            </div>
            <div className="flex justify-between border-b theme-border pb-1">
              <span className="theme-text-secondary uppercase">KHASRA NUMBER</span>
              <span className="font-bold theme-text-primary">{parcel.khasra_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary uppercase">PARCEL CODE</span>
              <span className="font-bold theme-text-primary">{parcel.parcel_code}</span>
            </div>
          </div>
        </div>

        {/* STATUTORY STATUS SECTION */}
        <div className="inst-panel p-4 space-y-3 font-mono">
          <div className="border-b theme-border pb-1.5 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">STATUTORY STATUS</h2>
            <span className="text-[10px] theme-text-secondary">ACQUISITION STATUS</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b theme-border pb-1">
              <span className="theme-text-secondary uppercase">CURRENT STAGE</span>
              <span className="font-bold text-emerald-600">{parcel.current_stage}</span>
            </div>
            <div className="flex justify-between border-b theme-border pb-1">
              <span className="theme-text-secondary uppercase">COMPENSATION STATUS</span>
              <span className="font-bold theme-text-primary">{parcel.compensation_status || 'PENDING_AWARD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary uppercase">POSSESSION STATUS</span>
              <span className="font-bold theme-text-primary">
                {parcel.current_stage.includes('POSSESSION') ? 'VERIFIED ON-SITE' : 'PENDING SURVEY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EVIDENCE VALIDATION & CONFIDENCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* CONFIDENCE BREAKDOWN TECHNICAL TABLE */}
        <ConfidenceGauge
          score={parcel.confidence_score}
          verdict={parcel.verdict}
          attestation={latestAttestation}
        />

        {/* EVIDENCE VALIDATION SIGNALS */}
        <div className="inst-panel p-4 space-y-3 font-mono text-xs">
          <div className="border-b theme-border pb-1.5 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">EVIDENCE VALIDATION</h2>
            <span className="text-[10px] theme-text-secondary">LATEST CAPTURE</span>
          </div>

          {latestCapture ? (
            <div className="space-y-2.5">
              <div className="flex justify-between border-b theme-border pb-1">
                <span className="theme-text-secondary">PIP MATCH:</span>
                <span className={`font-bold ${latestAttestation?.pip_inside ? 'text-emerald-600' : 'text-red-600'}`}>
                  {latestAttestation?.pip_inside ? 'INSIDE PARCEL (PASS)' : 'OUTSIDE PARCEL (FAIL)'}
                </span>
              </div>
              <div className="flex justify-between border-b theme-border pb-1">
                <span className="theme-text-secondary">DISTANCE TO CENTROID:</span>
                <span className="font-bold theme-text-primary">{latestAttestation?.distance_m ? `${latestAttestation.distance_m.toFixed(2)} M` : 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b theme-border pb-1">
                <span className="theme-text-secondary">GPS ACCURACY:</span>
                <span className="font-bold theme-text-primary">{latestCapture.gps_accuracy} M</span>
              </div>
              <div className="flex justify-between border-b theme-border pb-1">
                <span className="theme-text-secondary">DEVICE INTEGRITY:</span>
                <span className={`font-bold ${latestCapture.is_mock_location ? 'text-red-600' : 'text-emerald-600'}`}>
                  {latestCapture.is_mock_location ? 'MOCK LOCATION DETECTED' : 'CLEAN HARDWARE'}
                </span>
              </div>
              <div className="flex justify-between border-b theme-border pb-1">
                <span className="theme-text-secondary">NETWORK SIGNAL:</span>
                <span className="font-bold theme-text-primary">{latestCapture.network_type || 'CELLULAR 4G'}</span>
              </div>
              <div className="flex justify-between border-b theme-border pb-1">
                <span className="theme-text-secondary">BLE BEACON:</span>
                <span className="font-bold theme-text-primary">{latestCapture.ble_uuid ? 'DETECTED' : 'NONE'}</span>
              </div>
              <div className="flex justify-between border-b theme-border pb-1">
                <span className="theme-text-secondary">SHA-256 HASH:</span>
                <span className="font-bold text-[10px] theme-text-secondary truncate max-w-[200px]">{latestCapture.photo_hash}</span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center theme-text-secondary">NO FIELD EVIDENCE SUBMITTED YET.</div>
          )}
        </div>
      </div>

      {/* AUDIT TIMELINE */}
      <div className="space-y-2">
        <div className="border-b theme-border pb-1.5 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">OFFICIAL AUDIT REGISTRATION HISTORY</h2>
          <span className="text-xs font-mono theme-text-secondary">IMMUTABLE POSTGRES LOG</span>
        </div>
        <AuditTimeline auditLogs={auditLogs} />
      </div>

    </div>
  );
}
