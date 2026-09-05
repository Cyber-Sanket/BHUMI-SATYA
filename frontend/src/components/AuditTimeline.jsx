import React from 'react';

export default function AuditTimeline({ auditLogs = [] }) {
  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div className="inst-panel p-4 text-center text-xs theme-text-secondary font-mono">
        No administrative audit entries available for current query.
      </div>
    );
  }

  return (
    <div className="inst-panel space-y-0 overflow-hidden">
      <div className="inst-panel-header">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider theme-text-secondary">
          07 AUDIT TRAIL / REGISTER
        </span>
        <span className="text-[10px] font-mono theme-text-secondary">{auditLogs.length} AUDIT ENTRIES</span>
      </div>

      <div className="overflow-x-auto">
        <table className="cadastral-table font-mono text-[11px]">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Officer</th>
              <th>Action</th>
              <th>Parcel</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>Confidence</th>
              <th>Evidence Hash</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => {
              const isBlocked = log.action.includes('REJECTED') || log.action.includes('BLOCKED');
              const isVerified = log.action.includes('VERIFIED');
              const dateStr = new Date(log.timestamp).toLocaleString('en-US', { hour12: false });

              return (
                <tr key={log.id}>
                  <td className="theme-text-secondary whitespace-nowrap">{dateStr}</td>
                  <td className="theme-text-primary font-semibold">{log.user_id ? log.user_id.substring(0, 8) : 'OFFICER-01'}</td>
                  <td className={`font-bold uppercase ${isBlocked ? 'text-red-600' : (isVerified ? 'text-emerald-600' : 'theme-text-primary')}`}>
                    {log.action}
                  </td>
                  <td className="theme-text-primary font-bold">{log.parcel_id || '—'}</td>
                  <td className="text-[10px] theme-text-secondary max-w-[140px] truncate">
                    {log.old_value ? JSON.stringify(log.old_value) : '—'}
                  </td>
                  <td className="text-[10px] theme-text-primary max-w-[140px] truncate font-semibold">
                    {log.new_value ? JSON.stringify(log.new_value) : '—'}
                  </td>
                  <td className="font-bold theme-text-primary">
                    {log.confidence_score !== null ? `${log.confidence_score}%` : '—'}
                  </td>
                  <td className="text-[10px] text-blue-600 dark:text-blue-400 max-w-[160px] truncate">
                    {log.evidence_hash || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
