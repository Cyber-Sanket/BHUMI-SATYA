import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import ParcelCard from '../components/ParcelCard';
import AuditTimeline from '../components/AuditTimeline';
import { getVerdictBadgeClass } from '../services/mapUtils';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ onOpenSimulator, onSelectParcel }) {
  const [parcels, setParcels] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parcelsRes, alertsRes, auditRes] = await Promise.all([
        apiService.getParcels(),
        apiService.getAlerts(false),
        apiService.getAuditLogs()
      ]);
      setParcels(parcelsRes.data);
      setAlerts(alertsRes.data);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalParcels = parcels.length;
  const verifiedCount = parcels.filter(p => p.verdict === 'VERIFIED').length;
  const reviewCount = parcels.filter(p => p.verdict === 'REVIEW').length;
  const blockedCount = parcels.filter(p => p.verdict === 'BLOCKED').length;
  const stalledCount = parcels.filter(p => p.verdict === 'STALLED' || p.current_stage === 'INITIAL').length;

  const stageDistribution = [
    { stage: 'INITIAL NOTIFICATION', code: 'SEC-11', count: parcels.filter(p => p.current_stage === 'INITIAL').length, percent: totalParcels ? (parcels.filter(p => p.current_stage === 'INITIAL').length / totalParcels) * 100 : 0 },
    { stage: 'DECLARATION & SURVEY', code: 'SEC-19', count: parcels.filter(p => p.current_stage === 'DECLARATION').length, percent: totalParcels ? (parcels.filter(p => p.current_stage === 'DECLARATION').length / totalParcels) * 100 : 0 },
    { stage: 'VALUATION & AWARD', code: 'SEC-23', count: parcels.filter(p => p.current_stage === 'AWARD').length, percent: totalParcels ? (parcels.filter(p => p.current_stage === 'AWARD').length / totalParcels) * 100 : 0 },
    { stage: 'POSSESSION PENDING', code: 'SEC-38', count: parcels.filter(p => p.current_stage === 'POSSESSION_PENDING').length, percent: totalParcels ? (parcels.filter(p => p.current_stage === 'POSSESSION_PENDING').length / totalParcels) * 100 : 0 },
    { stage: 'POSSESSION VERIFIED', code: 'SEC-40', count: parcels.filter(p => p.current_stage === 'POSSESSION_VERIFIED').length, percent: totalParcels ? (parcels.filter(p => p.current_stage === 'POSSESSION_VERIFIED').length / totalParcels) * 100 : 0 },
  ];

  return (
    <div className="p-5 max-w-[1600px] mx-auto space-y-5 theme-text-primary select-none">
      
      {/* Page Header */}
      <div className="border-b theme-border pb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block">01 SYSTEM OVERVIEW</span>
          <h1 className="text-base font-bold theme-text-primary tracking-tight">LAND ACQUISITION CONTROL ROOM & SYSTEM STATUS</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/map')}
            className="px-3 py-1.5 theme-bg-secondary border theme-border theme-text-primary hover:opacity-90 font-mono text-xs font-semibold rounded-sm transition-colors"
          >
            OPEN CADASTRAL MAP
          </button>
          <button
            onClick={onOpenSimulator}
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-xs font-semibold rounded-sm transition-colors"
          >
            TEST FIELD SIMULATOR
          </button>
        </div>
      </div>

      {/* SYSTEM STATUS STRIP */}
      <div className="inst-panel p-3">
        <div className="text-[10px] font-mono theme-text-secondary uppercase tracking-wider mb-2 font-bold">SYSTEM STATUS STRIP</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono divide-x theme-border">
          <div className="px-2">
            <span className="text-[10px] theme-text-secondary uppercase block font-sans font-bold">TOTAL PARCELS</span>
            <span className="text-xl font-bold theme-text-primary">{String(totalParcels).padStart(2, '0')}</span>
          </div>
          <div className="px-2">
            <span className="text-[10px] text-emerald-600 uppercase block font-sans font-bold">VERIFIED</span>
            <span className="text-xl font-bold text-emerald-600">{String(verifiedCount).padStart(2, '0')}</span>
          </div>
          <div className="px-2">
            <span className="text-[10px] text-amber-600 uppercase block font-sans font-bold">REVIEW</span>
            <span className="text-xl font-bold text-amber-600">{String(reviewCount).padStart(2, '0')}</span>
          </div>
          <div className="px-2">
            <span className="text-[10px] text-red-600 uppercase block font-sans font-bold">BLOCKED</span>
            <span className="text-xl font-bold text-red-600">{String(blockedCount).padStart(2, '0')}</span>
          </div>
          <div className="px-2">
            <span className="text-[10px] theme-text-secondary uppercase block font-sans font-bold">STALLED</span>
            <span className="text-xl font-bold theme-text-secondary">{String(stalledCount).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: LEFT 65% CORRIDOR OVERVIEW / GIS PREVIEW, RIGHT 35% PRIORITY INCIDENTS */}
      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* LEFT 65%: CORRIDOR OVERVIEW / GIS PREVIEW */}
        <div className="w-full lg:w-[65%] space-y-3">
          <div className="flex items-center justify-between border-b theme-border pb-1.5">
            <div>
              <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block">02 CORRIDOR STATUS</span>
              <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">
                CORRIDOR OVERVIEW / CADASTRAL PARCELS
              </h2>
            </div>
            <span className="text-xs font-mono theme-text-secondary">SECTOR 4 — NAGPUR METRO</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {parcels.map((parcel) => (
              <ParcelCard key={parcel.id} parcel={parcel} onClick={onSelectParcel} />
            ))}
          </div>
        </div>

        {/* RIGHT 35%: PRIORITY INCIDENTS */}
        <div className="w-full lg:w-[35%] space-y-3">
          <div className="flex items-center justify-between border-b theme-border pb-1.5">
            <div>
              <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block">INCIDENT FEED</span>
              <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">
                PRIORITY INCIDENTS ({alerts.length})
              </h2>
            </div>
            <button 
              onClick={() => navigate('/alerts')} 
              className="text-[11px] font-mono theme-text-secondary hover:theme-text-primary underline"
            >
              VIEW ALL
            </button>
          </div>

          <div className="inst-panel p-3 space-y-2.5 max-h-[380px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono theme-text-secondary">
                NO ACTIVE PRIORITY INCIDENTS LOGGED.
              </div>
            ) : (
              alerts.map((alert) => {
                const borderClass = alert.severity === 'CRITICAL' || alert.severity === 'HIGH' 
                  ? 'border-l-4 border-l-red-600 theme-bg-secondary' 
                  : 'border-l-4 border-l-amber-600 theme-bg-secondary';

                return (
                  <div key={alert.id} className={`p-2.5 border theme-border ${borderClass} space-y-1`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold theme-text-primary font-mono">{alert.title}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 theme-bg-surface border theme-border font-bold theme-text-primary">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs theme-text-primary font-mono leading-tight">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono theme-text-secondary pt-1">
                      <span>PARCEL ID: {alert.parcel_id}</span>
                      <span>STATUS: {alert.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* EVIDENCE VERIFICATION TABLE */}
      <div className="space-y-2">
        <div className="border-b theme-border pb-1.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block">03 EVIDENCE REGISTER</span>
            <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">
              EVIDENCE VERIFICATION TABLE
            </h2>
          </div>
          <span className="text-xs font-mono theme-text-secondary">UPDATED REAL-TIME VIA FASTAPI POSTGIS</span>
        </div>

        <div className="inst-panel overflow-x-auto">
          <table className="cadastral-table">
            <thead>
              <tr>
                <th>PARCEL</th>
                <th>KHASRA</th>
                <th>STAGE</th>
                <th>VERDICT</th>
                <th>CONFIDENCE</th>
                <th>LAST EVIDENCE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectParcel && onSelectParcel(p)}
                  className="cursor-pointer hover:theme-bg-secondary transition-colors"
                >
                  <td className="font-mono font-bold theme-text-primary">{p.parcel_code}</td>
                  <td className="font-mono theme-text-primary">{p.khasra_number}</td>
                  <td className="text-xs theme-text-primary font-medium">{p.current_stage}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono ${getVerdictBadgeClass(p.verdict)}`}>
                      {p.verdict}
                    </span>
                  </td>
                  <td className="font-mono font-bold theme-text-primary">{p.confidence_score}%</td>
                  <td className="font-mono theme-text-secondary text-xs">
                    {p.updated_at ? new Date(p.updated_at).toLocaleTimeString() : 'INITIAL'}
                  </td>
                  <td className="font-mono text-xs">
                    <span className="theme-text-primary font-medium">
                      {p.verdict === 'VERIFIED' ? 'ACTIVE' : p.verdict === 'BLOCKED' ? 'ACTION REQ' : 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STATUTORY STAGE DISTRIBUTION */}
      <div className="space-y-2">
        <div className="border-b theme-border pb-1.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block">04 STATUTORY PROGRESS</span>
            <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">
              STATUTORY STAGE DISTRIBUTION
            </h2>
          </div>
          <span className="text-xs font-mono theme-text-secondary">RFCTLARR ACT 2013</span>
        </div>

        <div className="inst-panel p-4 space-y-3">
          {stageDistribution.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-mono theme-text-primary">
                <span className="font-bold">{item.stage} <span className="theme-text-secondary font-normal">({item.code})</span></span>
                <span>{item.count} PARCELS ({item.percent.toFixed(0)}%)</span>
              </div>
              <div className="w-full theme-bg-secondary h-2 border theme-border rounded-none overflow-hidden">
                <div 
                  className="bg-emerald-700 h-full transition-all duration-300"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT AUDIT ACTIVITY */}
      <div className="space-y-2">
        <div className="border-b theme-border pb-1.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block">05 AUDIT TRAIL</span>
            <h2 className="text-xs font-bold uppercase theme-text-primary tracking-wider">
              RECENT AUDIT ACTIVITY
            </h2>
          </div>
          <span className="text-xs font-mono theme-text-secondary">IMMUTABLE LOG</span>
        </div>
        <AuditTimeline auditLogs={auditLogs.slice(0, 5)} />
      </div>

    </div>
  );
}
