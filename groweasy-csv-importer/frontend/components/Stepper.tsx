'use client';

import type { Step } from '@/lib/types';

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'processing', label: 'Map' },
  { key: 'result', label: 'Result' },
];

export default function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center w-full max-w-xl mx-auto">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending';
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs border transition-colors',
                  state === 'done' && 'bg-signal/15 border-signal text-signal',
                  state === 'active' && 'bg-signal text-base border-signal font-semibold',
                  state === 'pending' && 'bg-surface border-line text-muted',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <span
                className={[
                  'text-[11px] font-mono uppercase tracking-wide',
                  state === 'pending' ? 'text-muted' : 'text-ink',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'h-px flex-1 mx-2 mb-5',
                  i < currentIndex ? 'bg-signal' : 'bg-line',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
