'use client';

import { useState } from 'react';
import { CRM_FIELDS, type ImportResult } from '@/lib/types';

export default function ResultTable({ result }: { result: ImportResult }) {
  const [tab, setTab] = useState<'imported' | 'skipped'>('imported');

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total rows" value={result.totalRows} tone="muted" />
        <StatCard label="Imported" value={result.totalImported} tone="signal" />
        <StatCard label="Skipped" value={result.totalSkipped} tone="warn" />
      </div>

      <div className="flex gap-2 mb-4">
        <TabButton active={tab === 'imported'} onClick={() => setTab('imported')}>
          Imported ({result.totalImported})
        </TabButton>
        <TabButton active={tab === 'skipped'} onClick={() => setTab('skipped')}>
          Skipped ({result.totalSkipped})
        </TabButton>
      </div>

      {tab === 'imported' ? (
        <div className="data-table-wrap max-h-[480px]">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {CRM_FIELDS.map((f) => (
                  <th key={f}>{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.records.map((rec, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  {CRM_FIELDS.map((f) => (
                    <td key={f}>{rec[f] || <span className="text-muted">—</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="data-table-wrap max-h-[480px]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Row #</th>
                <th>Reason skipped</th>
                <th>Source row (raw)</th>
              </tr>
            </thead>
            <tbody>
              {result.skipped.map((s, i) => (
                <tr key={i}>
                  <td>{s.row_number}</td>
                  <td className="text-warn">{s.reason}</td>
                  <td className="text-muted whitespace-normal max-w-[480px]">
                    {Object.entries(s.source_row || {})
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('  ·  ')}
                  </td>
                </tr>
              ))}
              {result.skipped.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-8">
                    Nothing skipped — every row had a usable email or mobile number.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'muted' | 'signal' | 'warn' }) {
  const toneClass = tone === 'signal' ? 'text-signal' : tone === 'warn' ? 'text-warn' : 'text-ink';
  return (
    <div className="border border-line bg-surface rounded-lg px-5 py-4">
      <p className="text-[11px] font-mono uppercase tracking-wide text-muted mb-1">{label}</p>
      <p className={['text-2xl font-mono font-semibold', toneClass].join(' ')}>{value.toLocaleString()}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wide border transition-colors',
        active ? 'bg-signal text-base border-signal font-semibold' : 'border-line text-muted hover:text-ink hover:border-muted',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
