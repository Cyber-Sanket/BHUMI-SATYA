import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function AlertsView({ onSelectParcel }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await apiService.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-4 select-none font-sans theme-text-primary">
      
      {/* Header */}
      <div className="border-b theme-border pb-3 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block">05 INCIDENT MANAGEMENT</span>
          <h1 className="text-base font-bold theme-text-primary tracking-tight">ALERT CENTER & INCIDENT MANAGEMENT REGISTER</h1>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-3 py-1 theme-bg-surface border theme-border theme-text-primary text-xs font-mono font-bold hover:theme-bg-secondary transition-colors rounded-sm"
        >
          REFRESH ALERTS
        </button>
      </div>

      {/* Serious Incident Management Table */}
      <div className="inst-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cadastral-table font-mono text-xs">
            <thead>
              <tr>
                <th className="w-24">SEVERITY</th>
                <th className="w-36">ALERT</th>
                <th className="w-28">PARCEL</th>
                <th>DESCRIPTION</th>
                <th className="w-24">CONFIDENCE</th>
                <th className="w-36">CREATED</th>
                <th className="w-24">STATUS</th>
                <th className="w-24">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 theme-text-secondary font-mono">
                    NO ACTIVE INCIDENT ALERTS REGISTERED IN SYSTEM.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => {
                  const dateStr = new Date(alert.created_at).toLocaleString();
                  const isHigh = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
                  const leftBorderClass = isHigh ? 'border-l-4 border-l-red-600 theme-bg-secondary' : 'border-l-4 border-l-amber-600 theme-bg-secondary';

                  return (
                    <tr key={alert.id} className={`${leftBorderClass} hover:opacity-90 transition-colors`}>
                      <td>
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${isHigh ? 'bg-red-700 text-white' : 'bg-amber-600 text-white'}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="font-bold theme-text-primary">{alert.alert_type}</td>
                      <td className="font-bold theme-text-primary">{alert.parcel_id}</td>
                      <td className="theme-text-primary max-w-sm font-sans text-xs">{alert.message}</td>
                      <td className="font-bold theme-text-primary">{alert.confidence_score ? `${alert.confidence_score}%` : '36.0%'}</td>
                      <td className="theme-text-secondary text-[11px] whitespace-nowrap">{dateStr}</td>
                      <td>
                        {alert.is_resolved ? (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">RESOLVED</span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 uppercase">OPEN</span>
                        )}
                      </td>
                      <td>
                        {!alert.is_resolved && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[10px] uppercase transition-colors rounded-sm"
                          >
                            RESOLVE
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
