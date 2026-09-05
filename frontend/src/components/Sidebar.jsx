import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Layers, FileCheck, AlertTriangle, History, UserCheck } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/map', label: 'GIS Map', icon: Map },
    { path: '/parcels-list', label: 'Parcels', icon: Layers },
    { path: '/evidence-log', label: 'Evidence', icon: FileCheck },
    { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
    { path: '/audit-trail', label: 'Audit Trail', icon: History },
    { path: '/landowner', label: 'Landowner Portal', icon: UserCheck },
  ];

  return (
    <aside className="w-[210px] theme-bg-surface border-r theme-border flex flex-col justify-between py-4 px-2 shrink-0 select-none text-sm font-medium">
      <div>
        {/* Minimal Section Label */}
        <span className="text-[10px] font-mono tracking-widest uppercase theme-text-secondary opacity-60 font-semibold mb-3 px-3 block">
          NAVIGATION
        </span>

        {/* Minimal Navigation List */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-1.5 text-sm font-medium transition-colors rounded-none ${
                    isActive
                      ? 'theme-bg-secondary theme-text-primary font-semibold border-l-2 border-emerald-600 dark:border-emerald-500'
                      : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary border-l-2 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400 opacity-100' : 'theme-text-secondary opacity-50'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Quiet Telemetry Status */}
      <div className="px-3 py-2 text-[10px] font-mono theme-text-secondary space-y-1 opacity-70">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="h-1 w-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          <span>SYSTEM OPERATIONAL</span>
        </div>
      </div>
    </aside>
  );
}
