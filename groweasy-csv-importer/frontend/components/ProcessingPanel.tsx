'use client';

import type { JobProgress } from '@/lib/types';


export default function ProcessingPanel({ progress }: { progress: JobProgress | null }) {
  const pct = progress && progress.totalBatches > 0 ? Math.round((progress.completedBatches / progress.totalBatches) * 100) : 0;

  const leftLabels = ['lead_name', 'phone', 'e-mail', 'stat_us', 'src', 'rmrks'];
  const rightLabels = ['name', 'mobile_without_country_code', 'email', 'crm_status', 'data_source', 'crm_note'];

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      <svg viewBox="0 0 480 200" className="w-full max-w-lg">
        {leftLabels.map((label, i) => {
          const y = 20 + i * 32;
          const done = pct > (i / leftLabels.length) * 100;
          return (
            <g key={label}>
              <rect x="10" y={y - 12} width="90" height="22" rx="4" fill="#1C2733" stroke="#28374A" />
              <text x="55" y={y + 3} textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono" fill="#8FA1B3">
                {label}
              </text>
              <path
                d={`M100 ${y} C 220 ${y}, 260 ${100}, 380 100`}
                stroke={done ? '#5EEAD4' : '#28374A'}
                strokeWidth="1.2"
                fill="none"
                opacity={done ? 0.9 : 0.4}
              />
            </g>
          );
        })}
        <rect x="380" y="88" width="90" height="24" rx="4" fill="#0F1720" stroke="#5EEAD4" strokeWidth="1.4" />
        <text x="425" y="103" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono" fill="#5EEAD4">
          CRM
        </text>
        {rightLabels.map((label, i) => {
          const y = 20 + i * 32;
          const done = pct > (i / rightLabels.length) * 100;
          return (
            <g key={label}>
              <path
                d={`M380 100 C 300 100, 260 ${y}, 380 ${y}`}
                stroke={done ? '#5EEAD4' : '#28374A'}
                strokeWidth="1.2"
                fill="none"
                opacity={0}
              />
              <rect
                x="380"
                y={y - 12}
                width="96"
                height="22"
                rx="4"
                fill={done ? '#132621' : '#1C2733'}
                stroke={done ? '#5EEAD4' : '#28374A'}
                className={done ? '' : 'animate-pulse-line'}
              />
              <text x="428" y={y + 3} textAnchor="middle" fontSize="8.5" fontFamily="IBM Plex Mono" fill={done ? '#5EEAD4' : '#8FA1B3'}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs font-mono text-muted mb-2">
          <span>Mapping batches</span>
          <span>
            {progress?.completedBatches ?? 0} / {progress?.totalBatches ?? '—'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden border border-line">
          <div className="h-full bg-signal transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-center text-xs font-mono text-muted mt-3">
          {progress?.totalRows ? `Resolving ${progress.totalRows.toLocaleString()} rows into the CRM schema…` : 'Starting…'}
        </p>
      </div>
    </div>
  );
}
