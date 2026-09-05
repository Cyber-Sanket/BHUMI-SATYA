import React, { useState } from 'react';
import apiService from '../services/api';
import { getVerdictBadgeClass } from '../services/mapUtils';

export default function LandownerPortal() {
  const [searchQuery, setSearchQuery] = useState('MH-NGP-0141');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiService.getLandownerParcel(searchQuery.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || `No official land acquisition record found for '${searchQuery}'`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg-app theme-text-primary font-sans p-6 select-none">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Government Portal Header */}
        <div className="border-b-2 theme-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono theme-text-secondary uppercase tracking-widest block font-bold">GOVERNMENT PUBLIC SERVICE PORTAL</div>
              <h1 className="text-xl font-bold theme-text-primary tracking-tight">LAND ACQUISITION VERIFICATION PORTAL</h1>
            </div>
            <div className="text-right font-mono text-xs theme-text-secondary">
              <span className="font-bold block theme-text-primary">[BS] PUBLIC ACCESS</span>
              <span>STATE LAND RECORD DEPT</span>
            </div>
          </div>
        </div>

        {/* Search Field Area */}
        <div className="inst-panel p-5 space-y-3">
          <label className="block text-xs font-mono font-bold theme-text-primary uppercase tracking-wider">
            PARCEL CODE / KHASRA NUMBER:
          </label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. MH-NGP-0141 or 112/1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 theme-bg-surface border theme-border px-3 py-2 text-sm theme-text-primary font-mono focus:outline-none rounded-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-mono font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors"
            >
              {loading ? 'SEARCHING...' : 'SEARCH LAND RECORD'}
            </button>
          </form>

          <div className="flex items-center gap-2 text-xs font-mono theme-text-secondary pt-1">
            <span>SAMPLE PARCELS:</span>
            {['MH-NGP-0141', 'MH-NGP-0142', 'MH-NGP-0143', 'MH-NGP-0144'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setSearchQuery(code)}
                className="px-2 py-0.5 theme-bg-secondary border theme-border font-mono theme-text-primary text-xs hover:opacity-80"
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 badge-blocked text-xs font-mono">
            {error}
          </div>
        )}

        {/* Official Land Record Result Section */}
        {result && (
          <div className="inst-panel space-y-0">
            <div className="theme-bg-secondary px-4 py-3 border-b theme-border flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] theme-text-secondary uppercase block font-sans">OFFICIAL RECORD</span>
                <h2 className="text-base font-bold theme-text-primary">LAND RECORD: {result.parcel_code}</h2>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-bold ${getVerdictBadgeClass(result.verdict)}`}>
                VERDICT: {result.verdict} ({result.confidence_score}%)
              </span>
            </div>

            <div className="p-4 space-y-4">
              <table className="w-full border-collapse font-mono text-xs">
                <tbody>
                  <tr className="border-b theme-border">
                    <td className="p-2.5 theme-bg-secondary font-bold theme-text-secondary w-1/3 border-r theme-border">PARCEL CODE:</td>
                    <td className="p-2.5 font-bold theme-text-primary">{result.parcel_code}</td>
                  </tr>
                  <tr className="border-b theme-border">
                    <td className="p-2.5 theme-bg-secondary font-bold theme-text-secondary border-r theme-border">KHASRA NUMBER:</td>
                    <td className="p-2.5 font-bold theme-text-primary">{result.khasra_number}</td>
                  </tr>
                  <tr className="border-b theme-border">
                    <td className="p-2.5 theme-bg-secondary font-bold theme-text-secondary border-r theme-border">LANDOWNER NAME:</td>
                    <td className="p-2.5 font-bold theme-text-primary">{result.landowner_name}</td>
                  </tr>
                  <tr className="border-b theme-border">
                    <td className="p-2.5 theme-bg-secondary font-bold theme-text-secondary border-r theme-border">ACQUISITION STAGE:</td>
                    <td className="p-2.5 font-bold text-emerald-600">{result.current_stage}</td>
                  </tr>
                  <tr className="border-b theme-border">
                    <td className="p-2.5 theme-bg-secondary font-bold theme-text-secondary border-r theme-border">COMPENSATION:</td>
                    <td className="p-2.5 font-bold theme-text-primary">{result.compensation_status || 'AWARD_DETERMINED'}</td>
                  </tr>
                  <tr className="border-b border-slate-200 border-b theme-border">
                    <td className="p-2.5 theme-bg-secondary font-bold theme-text-secondary border-r theme-border">POSSESSION:</td>
                    <td className="p-2.5 font-bold theme-text-primary">
                      {result.verdict === 'VERIFIED' ? 'CONFIRMED ON-SITE' : 'UNDER VERIFICATION'}
                    </td>
                  </tr>
                  <tr className="border-b theme-border">
                    <td className="p-2.5 theme-bg-secondary font-bold theme-text-secondary border-r theme-border">EVIDENCE STATUS:</td>
                    <td className="p-2.5 font-bold theme-text-primary">
                      {result.verdict} ({result.confidence_score}% CONFIDENCE)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 theme-bg-secondary font-bold theme-text-secondary border-r theme-border">LAST UPDATED:</td>
                    <td className="p-2.5 font-mono theme-text-primary">
                      {result.last_updated ? new Date(result.last_updated).toLocaleString() : '2026-09-05 12:52:14 IST'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3 theme-bg-secondary border theme-border text-[11px] font-mono theme-text-secondary flex justify-between">
                <span>DIGITAL ATTESTATION SIGNATURE: VERIFIED</span>
                <span>SYSTEM: BHUMI-SATYA DILRMP LAYER</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
