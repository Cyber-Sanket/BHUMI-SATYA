import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FieldSimulatorModal from './components/FieldSimulatorModal';

import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import ParcelDetail from './pages/ParcelDetail';
import AlertsView from './pages/AlertsView';
import LandownerPortal from './pages/LandownerPortal';
import AuditTimeline from './components/AuditTimeline';
import apiService from './services/api';

function AppContent() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [parcels, setParcels] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const fetchGlobalData = async () => {
    try {
      const [parcelsRes, alertsRes, auditRes] = await Promise.all([
        apiService.getParcels(),
        apiService.getAlerts(false),
        apiService.getAuditLogs()
      ]);
      setParcels(parcelsRes.data);
      setAlertsCount(alertsRes.data.length);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Error loading app data:', err);
    }
  };

  const handleSelectParcel = (parcel) => {
    setSelectedParcel(parcel);
    navigate('/parcel-detail');
  };

  const handleEvidenceSubmitted = () => {
    fetchGlobalData();
  };

  return (
    <div className="flex flex-col min-h-screen theme-bg-app theme-text-primary font-sans">
      <Navbar
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        activeAlertsCount={alertsCount}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto theme-bg-app">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  onOpenSimulator={() => setIsSimulatorOpen(true)}
                  onSelectParcel={handleSelectParcel}
                />
              }
            />
            <Route
              path="/map"
              element={<MapView onSelectParcel={handleSelectParcel} />}
            />
            <Route
              path="/parcels-list"
              element={
                <Dashboard
                  onOpenSimulator={() => setIsSimulatorOpen(true)}
                  onSelectParcel={handleSelectParcel}
                />
              }
            />
            <Route
              path="/evidence-log"
              element={
                <div className="p-5 max-w-7xl mx-auto space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">04 EVIDENCE REGISTER</span>
                      <h1 className="text-base font-bold text-slate-900 tracking-tight">FIELD EVIDENCE INGESTION REGISTER</h1>
                    </div>
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-sm">
                      TOTAL RECORDED: {auditLogs.length}
                    </span>
                  </div>
                  <AuditTimeline auditLogs={auditLogs} />
                </div>
              }
            />
            <Route
              path="/parcel-detail"
              element={
                <ParcelDetail
                  parcel={selectedParcel || parcels[0]}
                  onBack={() => navigate('/')}
                />
              }
            />
            <Route
              path="/alerts"
              element={<AlertsView onSelectParcel={handleSelectParcel} />}
            />
            <Route
              path="/audit-trail"
              element={
                <div className="p-5 max-w-7xl mx-auto space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">06 AUDIT REGISTER</span>
                      <h1 className="text-base font-bold text-slate-900 tracking-tight">SYSTEM AUDIT & VERIFICATION TRAIL</h1>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs text-slate-600">
                      <span>AUDIT LOG: ACTIVE</span>
                      <span>CRS: EPSG:4326</span>
                    </div>
                  </div>
                  <AuditTimeline auditLogs={auditLogs} />
                </div>
              }
            />
            <Route path="/landowner" element={<LandownerPortal />} />
          </Routes>
        </main>
      </div>

      {/* Field Officer Evidence Simulator Modal */}
      <FieldSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        parcels={parcels}
        onEvidenceSubmitted={handleEvidenceSubmitted}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
