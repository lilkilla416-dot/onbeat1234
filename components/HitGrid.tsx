'use client';

import type { VocalHit } from '../lib/types';

const STATUS_COLOR: Record<string, string> = {
  'in-pocket': '#34d399',
  rushed:      '#f87171',
  dragged:     '#fbbf24',
  off:         '#374151',
};

const MONO = { fontFamily: 'var(--font-geist-mono)' };

export default function HitGrid({ hits }: { hits: VocalHit[] }) {
  if (hits.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-xl text-sm"
        style={{ background: 'var(--s1)', border: '1px solid var(--b1)', color: 'var(--text-3)' }}>
        No vocal hits detected
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl"
      style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Syllable Map</span>
        <span className="text-[11px]" style={{ color: 'var(--text-3)', ...MONO }}>{hits.length} hits</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {hits.map((hit, idx) => {
          const col = STATUS_COLOR[hit.status] ?? '#374151';
          const isGood = hit.status === 'in-pocket';
          return (
            <div
              key={idx}
              className="group relative w-[18px] h-[18px] rounded cursor-default"
              style={{
                backgroundColor: col + (isGood ? '28' : '18'),
                border: `1px solid ${col}${isGood ? '55' : '33'}`,
              }}
              title={`#${idx + 1}  ${hit.offsetMs >= 0 ? '+' : ''}${hit.offsetMs.toFixed(1)}ms  ${hit.status}`}
            >
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2
                mb-1.5 z-50 pointer-events-none">
                <div className="rounded-lg px-2.5 py-2 text-[11px] whitespace-nowrap shadow-2xl"
                  style={{ background: 'var(--s2)', border: '1px solid var(--b2)', ...MONO }}>
                  <div className="font-medium mb-0.5" style={{ color: col }}>
                    {hit.status}
                  </div>
                  <div style={{ color: 'var(--text-2)' }}>
                    {hit.offsetMs >= 0 ? '+' : ''}{hit.offsetMs.toFixed(1)} ms
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                    t = {hit.time.toFixed(2)}s
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-1" style={{ borderTop: '1px solid var(--b1)' }}>
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: color + '44', border: `1px solid ${color}55` }} />
            <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
              {status.replace('-', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
