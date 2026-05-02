'use client';

import type { VocalHit } from '../lib/types';

interface Props {
  hits: VocalHit[];
  maxCols?: number;
}

const STATUS_COLOR: Record<string, string> = {
  'in-pocket': '#00ff88',
  rushed:      '#ff3344',
  dragged:     '#ffcc00',
  off:         '#333344',
};

const STATUS_GLOW: Record<string, string> = {
  'in-pocket': '0 0 8px #00ff8888, 0 0 2px #00ff88',
  rushed:      '0 0 8px #ff334488, 0 0 2px #ff3344',
  dragged:     '0 0 8px #ffcc0088, 0 0 2px #ffcc00',
  off:         'none',
};

const STATUS_LABEL: Record<string, string> = {
  'in-pocket': '✓',
  rushed:      '◀',
  dragged:     '▶',
  off:         '✕',
};

export default function HitGrid({ hits, maxCols = 32 }: Props) {
  if (hits.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-zinc-700 font-mono text-xs
        border border-zinc-800 rounded-lg bg-zinc-950/60">
        NO VOCAL HITS DETECTED
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/80
      shadow-[0_0_20px_rgba(0,200,255,0.05)]">

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono tracking-widest text-cyan-600 uppercase">
          ◈ Vocal Hit Map
        </div>
        <div className="text-xs font-mono text-zinc-500">
          {hits.length} syllables
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1"
        style={{ maxWidth: `${maxCols * 20}px` }}
      >
        {hits.map((hit, idx) => {
          const col = STATUS_COLOR[hit.status] ?? '#333';
          const glow = STATUS_GLOW[hit.status] ?? 'none';
          const symbol = STATUS_LABEL[hit.status] ?? '?';

          return (
            <div
              key={idx}
              className="group relative flex items-center justify-center
                w-4 h-4 rounded-sm text-[8px] font-mono cursor-default"
              style={{
                backgroundColor: col + '22',
                border: `1px solid ${col}55`,
                color: col,
                boxShadow: hit.status !== 'off' ? glow : undefined,
              }}
              title={`Hit #${idx + 1}  t=${hit.time.toFixed(3)}s  offset=${hit.offsetMs >= 0 ? '+' : ''}${hit.offsetMs.toFixed(1)}ms  ${hit.status}`}
            >
              {symbol}

              {/* Tooltip */}
              <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2
                mb-1 z-50 flex-col items-center pointer-events-none">
                <div className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1
                  text-[10px] font-mono whitespace-nowrap text-zinc-200 shadow-xl">
                  <div style={{ color: col }}>{hit.status.toUpperCase()}</div>
                  <div>t = {hit.time.toFixed(3)}s</div>
                  <div>Δ = {hit.offsetMs >= 0 ? '+' : ''}{hit.offsetMs.toFixed(1)} ms</div>
                </div>
                <div className="w-1.5 h-1.5 bg-zinc-900 border-r border-b border-zinc-700 rotate-45 -mt-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm border" style={{
              backgroundColor: color + '33',
              borderColor: color + '66',
              boxShadow: status !== 'off' ? `0 0 4px ${color}88` : undefined,
            }} />
            <span style={{ color: color + 'cc' }}>{status.replace('-', ' ').toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
