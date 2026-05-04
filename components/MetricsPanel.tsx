'use client';

import type { AnalysisResult } from '../lib/types';

const MONO = { fontFamily: 'var(--font-geist-mono)' };

function OffsetBar({ avgMs }: { avgMs: number }) {
  const clamped = Math.max(-80, Math.min(80, avgMs));
  const pct     = ((clamped + 80) / 160) * 100;
  const col     = clamped < -5 ? '#ef4444' : clamped > 5 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-2)' }}>
        <span>Rushed</span>
        <span style={{ color: col, ...MONO }}>
          {avgMs >= 0 ? '+' : ''}{avgMs.toFixed(1)} ms avg offset
        </span>
        <span>Dragged</span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: 'var(--b2)' }}>
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: 'var(--b3)' }} />
        <div
          className="absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full transition-all duration-500"
          style={{ left: `${pct}%`, backgroundColor: col, boxShadow: `0 0 8px ${col}88` }}
        />
      </div>
    </div>
  );
}

export default function MetricsPanel({ result }: { result: AnalysisResult | null }) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-28 rounded-2xl text-sm"
        style={{ background: 'var(--s1)', border: '1px solid var(--b1)', color: 'var(--text-3)' }}>
        Load tracks &amp; analyze to see metrics
      </div>
    );
  }

  const inPocket = result.vocalHits.filter(h => h.status === 'in-pocket').length;
  const rushed   = result.vocalHits.filter(h => h.status === 'rushed').length;
  const dragged  = result.vocalHits.filter(h => h.status === 'dragged').length;
  const off      = result.vocalHits.filter(h => h.status === 'off').length;
  const total    = result.vocalHits.length;

  const accColor = result.accuracy >= 70 ? '#10b981' : result.accuracy >= 40 ? '#f59e0b' : '#ef4444';
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (result.accuracy / 100) * circ;

  return (
    <div className="flex flex-col gap-5 rounded-2xl p-5"
      style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>

      {/* Hero row: accuracy ring + key numbers */}
      <div className="flex items-center gap-6">

        {/* Accuracy ring */}
        <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
          <svg width="120" height="120" className="rotate-[-90deg]">
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8"
              style={{ stroke: 'var(--b2)' }} />
            <circle cx="60" cy="60" r={r} fill="none"
              stroke={accColor} strokeWidth="8"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)',
                filter: `drop-shadow(0 0 6px ${accColor}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[40px] font-bold leading-none tracking-tight"
              style={{ ...MONO, color: accColor }}>{result.accuracy}</span>
            <span className="text-sm font-medium mt-0.5" style={{ color: accColor, opacity: 0.7 }}>%</span>
            <span className="text-[10px] mt-1 uppercase tracking-widest"
              style={{ color: 'var(--text-3)' }}>in pocket</span>
          </div>
        </div>

        {/* Big stats */}
        <div className="flex flex-col gap-3 flex-1">
          {/* BPM — hero stat */}
          <div className="flex items-baseline gap-2">
            <span className="text-[48px] font-bold leading-none tracking-tight"
              style={{ ...MONO, color: 'var(--text)' }}>
              {result.bpm.toFixed(1)}
            </span>
            <span className="text-base font-medium" style={{ color: 'var(--text-2)' }}>BPM</span>
          </div>
          {/* Secondary stats */}
          <div className="flex gap-4">
            {[
              { v: result.beats.length, l: 'beats' },
              { v: total,               l: 'hits'  },
              { v: `±${result.pocketWindow}`, l: 'ms pocket' },
            ].map(({ v, l }) => (
              <div key={l}>
                <div className="text-xl font-semibold" style={{ ...MONO, color: 'var(--text)' }}>{v}</div>
                <div className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'In Pocket', count: inPocket, col: '#10b981' },
          { label: 'Rushed',    count: rushed,   col: '#ef4444' },
          { label: 'Dragged',   count: dragged,  col: '#f59e0b' },
          { label: 'Off Beat',  count: off,      col: '#475569' },
        ].map(({ label, count, col }) => (
          <div key={label} className="flex flex-col items-center gap-1 py-2.5 rounded-xl"
            style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
            <span className="text-2xl font-bold tabular-nums" style={{ color: col, ...MONO }}>{count}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide"
              style={{ color: 'var(--text-3)' }}>{label}</span>
          </div>
        ))}
      </div>

      {total > 0 && <OffsetBar avgMs={result.avgOffsetMs} />}
    </div>
  );
}
