'use client';

import type { AnalysisResult } from '../lib/types';

const MONO = { fontFamily: 'var(--font-geist-mono)' };

function Stat({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="text-[10px] text-white/30 uppercase tracking-widest font-medium">{label}</div>
      <div className="text-xl font-semibold text-white/85 leading-none" style={MONO}>
        {value}
        {unit && <span className="text-sm text-white/30 ml-1 font-normal">{unit}</span>}
      </div>
    </div>
  );
}

function AccuracyRing({ pct }: { pct: number }) {
  const r    = 34;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative w-[88px] h-[88px] shrink-0">
      <svg width="88" height="88" className="rotate-[-90deg]">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
        <circle cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold leading-none" style={{ ...MONO, color }}>{pct}%</span>
        <span className="text-[9px] text-white/30 mt-0.5 uppercase tracking-widest">pocket</span>
      </div>
    </div>
  );
}

function OffsetBar({ avgMs }: { avgMs: number }) {
  const clamped = Math.max(-80, Math.min(80, avgMs));
  const pct     = ((clamped + 80) / 160) * 100;
  const color   = clamped < -5 ? '#f87171' : clamped > 5 ? '#fbbf24' : '#34d399';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[10px] text-white/25 font-medium">
        <span>Rushed</span>
        <span className="text-white/45" style={MONO}>
          {avgMs >= 0 ? '+' : ''}{avgMs.toFixed(1)} ms avg
        </span>
        <span>Dragged</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/[0.05] overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
        <div className="absolute top-0.5 bottom-0.5 w-2.5 -ml-1.5 rounded-full transition-all duration-500"
          style={{ left: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function MetricsPanel({ result }: { result: AnalysisResult | null }) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-32 rounded-xl
        bg-white/[0.02] border border-white/[0.05] text-sm text-white/20">
        Load tracks to see metrics
      </div>
    );
  }

  const inPocket = result.vocalHits.filter(h => h.status === 'in-pocket').length;
  const rushed   = result.vocalHits.filter(h => h.status === 'rushed').length;
  const dragged  = result.vocalHits.filter(h => h.status === 'dragged').length;
  const off      = result.vocalHits.filter(h => h.status === 'off').length;
  const total    = result.vocalHits.length;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-white/[0.025]
      border border-white/[0.06]">

      <div className="text-xs text-white/35 font-medium">Analysis</div>

      <div className="flex gap-3 items-center">
        <AccuracyRing pct={result.accuracy} />
        <div className="grid grid-cols-2 gap-2 flex-1">
          <Stat label="BPM"    value={result.bpm.toFixed(1)} />
          <Stat label="Beats"  value={result.beats.length} />
          <Stat label="Hits"   value={total} />
          <Stat label="Window" value={result.pocketWindow} unit="ms" />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-4 gap-1.5 text-xs">
        {[
          { label: 'In Pocket', count: inPocket, color: '#34d399' },
          { label: 'Rushed',    count: rushed,   color: '#f87171' },
          { label: 'Dragged',   count: dragged,  color: '#fbbf24' },
          { label: 'Off',       count: off,      color: '#4b5563' },
        ].map(({ label, count, color }) => (
          <div key={label}
            className="flex flex-col items-center gap-0.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <span className="text-sm font-semibold" style={{ ...MONO, color }}>{count}</span>
            <span className="text-[9px] text-white/30 text-center leading-tight">{label}</span>
          </div>
        ))}
      </div>

      {total > 0 && <OffsetBar avgMs={result.avgOffsetMs} />}
    </div>
  );
}
