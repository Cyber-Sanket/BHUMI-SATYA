import React from 'react';
import { Smartphone, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenSimulator, activeAlertsCount = 0 }) {
  const { user, logout } = useAuth();
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false }) + ' IST';

  return (
    <header className="h-12 theme-bg-surface border-b theme-border px-4 flex items-center justify-between text-xs shrink-0 select-none">
      {/* Left: Brand Mark */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono font-bold text-xs flex items-center justify-center rounded-[2px] shadow-sm">
            BS
          </div>
          <div>
            <div className="font-extrabold theme-text-primary text-xs tracking-tight leading-none flex items-center gap-1.5">
              BHUMI-SATYA
              <span className="text-[9px] font-mono theme-text-secondary font-normal border-l theme-border pl-1.5">v1.0</span>
            </div>
            <div className="text-[9px] font-mono theme-text-secondary font-semibold tracking-wider uppercase mt-0.5">
              Land Acquisition Evidence System
            </div>
          </div>
        </div>

        <div className="h-5 w-px theme-border hidden md:block" />

        {/* Center/Left: Project Title */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] theme-text-secondary">
          <span className="theme-text-secondary font-sans uppercase font-bold text-[9px]">PROJECT:</span>
          <span className="font-bold theme-text-primary">Nagpur Metro Rail Corridor — Sector 4</span>
          <span className="px-1 py-0.2 theme-bg-secondary border theme-border theme-text-primary text-[10px] rounded-[2px]">
            PRJ-NGP-METRO-02
          </span>
        </div>
      </div>

      {/* Right: Technical Telemetry & Controls */}
      <div className="flex items-center gap-3">
        {/* PostGIS Telemetry */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] theme-text-secondary theme-bg-secondary border theme-border px-2 py-0.5 rounded-[2px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span>POSTGIS: ONLINE</span>
          <span className="opacity-40">|</span>
          <span>CRS: EPSG:4326</span>
          <span className="opacity-40">|</span>
          <span className="theme-text-secondary">{currentTime}</span>
        </div>

        {/* Field Capture Simulator Button */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-[2px] text-xs transition-colors shadow-sm"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>FIELD SIMULATOR</span>
        </button>

        {/* Alerts Badge */}
        {activeAlertsCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 badge-blocked font-mono text-[11px] rounded-[2px]">
            <Bell className="h-3 w-3" />
            <span>{activeAlertsCount} ALERT{activeAlertsCount > 1 ? 'S' : ''}</span>
          </div>
        )}

        <div className="h-4 w-px theme-border" />

        {/* User Badge */}
        <div className="flex items-center gap-1.5 theme-text-secondary font-mono text-[11px]">
          <User className="h-3.5 w-3.5 theme-text-secondary" />
          <span className="font-bold theme-text-primary">{user?.full_name || 'Officer'}</span>
          <span className="text-[9px] theme-text-secondary uppercase">({user?.role || 'FIELD_OFFICER'})</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out of workstation"
          className="flex items-center gap-1 px-2 py-0.5 theme-bg-secondary hover:bg-red-900/20 text-red-600 dark:text-red-400 font-mono font-bold text-[10px] border theme-border rounded-[2px] transition-colors"
        >
          <LogOut className="h-3 w-3" />
          <span>LOGOUT</span>
        </button>
      </div>
    </header>
  );
}
