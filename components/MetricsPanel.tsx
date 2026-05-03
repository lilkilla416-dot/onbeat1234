'use client';

import type { AnalysisResult } from '../lib/types';

interface Props {
  result: AnalysisResult | null;
}

function StatBox({ label, value, unit = '', color = '#00ccff', glow = false }: {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  glow?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1
      border border-zinc-800 rounded-lg p-3 bg-zinc-950/80 min-w-[90px]">
      <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
        {label}
      </div>
      <div
        className="text-2xl font-mono font-bold leading-none"
        style={{
          color,
          textShadow: glow ? `0 0 12px ${color}, 0 0 24px ${color}55` : undefined,
        }}
      >
        {value}
        <span className="text-sm font-normal ml-0.5 text-zinc-400">{unit}</span>
      </div>
    </div>
  );
}

function OffsetBar({ avgMs }: { avgMs: number }) {
  // Map -80..+80 ms to 0..100%
  const clamped = Math.max(-80, Math.min(80, avgMs));
  const pct = ((clamped + 80) / 160) * 100;
  const isRush = clamped < -5;
  const isDrag = clamped > 5;
  const color = isRush ? '#ff3344' : isDrag ? '#ffcc00' : '#00ff88';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] font-mono text-zinc-500">
        <span>◀ RUSHED</span>
        <span>AVG OFFSET</span>
        <span>DRAGGED ▶</span>
      </div>
      <div className="relative h-3 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
        {/* Center tick */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-600" />
        {/* Marker */}
        <div
          className="absolute top-0.5 bottom-0.5 w-2 rounded-full transition-all duration-500"
          style={{
            left: `calc(${pct}% - 4px)`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
      <div className="text-center text-xs font-mono" style={{ color }}>
        {avgMs >= 0 ? '+' : ''}{avgMs.toFixed(1)} ms
      </div>
    </div>
  );
}

function AccuracyRing({ pct }: { pct: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#00ff88' : pct >= 40 ? '#ffcc00' : '#ff3344';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" className="rotate-[-90deg]">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#1a1a2e" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: 'stroke-dasharray 0.6s ease',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-mono font-bold" style={{ color, textShadow: `0 0 10px ${color}` }}>
            {pct}%
          </span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">pocket</span>
        </div>
      </div>
    </div>
  );
}

export default function MetricsPanel({ result }: Props) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-700 font-mono text-sm
        border border-zinc-800 rounded-lg bg-zinc-950/60">
        LOAD TRACKS TO SEE METRICS
      </div>
    );
  }

  const inPocket  = result.vocalHits.filter(h => h.status === 'in-pocket').length;
  const rushed    = result.vocalHits.filter(h => h.status === 'rushed').length;
  const dragged   = result.vocalHits.filter(h => h.status === 'dragged').length;
  const off       = result.vocalHits.filter(h => h.status === 'off').length;
  const total     = result.vocalHits.length;

  return (
    <div className="flex flex-col gap-4 border border-zinc-800 rounded-xl p-4 bg-zinc-950/80
      shadow-[0_0_20px_rgba(0,200,255,0.05)]">

      {/* Header */}
      <div className="text-xs font-mono tracking-widest text-cyan-600 uppercase">
        ◈ Analysis Metrics
      </div>

      {/* Top row */}
      <div className="flex flex-wrap gap-3 items-center">
        <AccuracyRing pct={result.accuracy} />

        <div className="flex flex-wrap gap-2 flex-1">
          <StatBox label="BPM" value={result.bpm.toFixed(1)} color="#00ccff" glow />
          <StatBox label="Beats" value={result.beats.length} color="#8888ff" />
          <StatBox label="Hits" value={total} color="#ff88cc" />
          <StatBox label="Pocket ±" value={result.pocketWindow} unit="ms" color="#00ff88" />
        </div>
      </div>

      {/* Breakdown pills */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {[
          { label: 'IN POCKET', count: inPocket, color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
          { label: 'RUSHED',    count: rushed,   color: '#ff3344', bg: 'rgba(255,51,68,0.1)' },
          { label: 'DRAGGED',   count: dragged,  color: '#ffcc00', bg: 'rgba(255,204,0,0.1)' },
          { label: 'OFF',       count: off,      color: '#555566', bg: 'rgba(80,80,100,0.1)' },
        ].map(({ label, count, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
            style={{ color, borderColor: color + '44', backgroundColor: bg }}
          >
            <span className="font-bold">{count}</span>
            <span className="opacity-70">{label}</span>
          </div>
        ))}
      </div>

      {/* Avg offset bar */}
      <OffsetBar avgMs={result.avgOffsetMs} />
    </div>
  );
}
