import React from 'react';
import { getVerdictBadgeClass } from '../services/mapUtils';
import { ChevronRight } from 'lucide-react';

export default function ParcelCard({ parcel, onClick }) {
  if (!parcel) return null;

  return (
    <div
      onClick={() => onClick && onClick(parcel)}
      className="inst-panel p-2.5 cursor-pointer hover:theme-bg-secondary transition-colors flex flex-col justify-between space-y-2 select-none group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xs theme-text-primary font-mono group-hover:text-emerald-700 transition-colors">
            {parcel.parcel_code}
          </span>
          <span className="text-[10px] theme-text-secondary font-mono">Kh. {parcel.khasra_number}</span>
        </div>

        <span className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-bold ${getVerdictBadgeClass(parcel.verdict)}`}>
          {parcel.verdict}
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1 border-t theme-border">
        <span className="theme-text-secondary truncate max-w-[130px]">
          {parcel.landowner_name || 'Unassigned'}
        </span>
        <span className="font-mono theme-text-primary text-[10px] font-semibold">
          {parcel.current_stage}
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono theme-text-secondary pt-0.5">
        <span>Conf: <strong className="theme-text-primary font-bold">{parcel.confidence_score}%</strong></span>
        <span className="text-emerald-600 font-bold flex items-center group-hover:translate-x-0.5 transition-transform">
          INSPECT <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
