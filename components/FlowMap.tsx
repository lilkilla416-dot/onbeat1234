'use client';

import type { Beat, VocalHit, AnalysisResult } from '../lib/types';

/* ────────────────────────────────────────────────────────
   ABAB Flow Map
   Shows the first 8 bars (= 4 lines, ABAB rhyme structure)
   of the track as a beat-by-beat pocket grid.
   Each cell = one beat slot; filled if a vocal hit lands
   within ±(beatInterval/2) of that beat.
──────────────────────────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  'in-pocket': '#00ff88',
  rushed:      '#ff3344',
  dragged:     '#ffcc00',
  off:         '#cc4455',
};

const STATUS_SYMBOL: Record<string, string> = {
  'in-pocket': '✓',
  rushed:      '◀',
  dragged:     '▶',
  off:         '✕',
};

const STATUS_LABEL: Record<string, string> = {
  'in-pocket': 'in pocket',
  rushed:      'rushed',
  dragged:     'dragged',
  off:         'off beat',
};

/** Fix suggestion for a line based on its dominant issue. */
function lineFix(rushed: number, dragged: number, off: number, total: number): string | null {
  if (total === 0) return null;
  if (off / total > 0.3)     return 'Rewrite these bars — syllable count doesn\'t fit the BPM grid.';
  if (rushed / total > 0.4)  return 'Add a pickup syllable ("and", "uh") before the first strong word.';
  if (dragged / total > 0.4) return 'Front-load the line — start with a hard consonant, cut vowel holds.';
  if ((rushed + dragged + off) / total > 0.5)
    return 'Mixed timing — practice speaking this line to the click track without melody.';
  return null;
}

interface BeatSlotProps {
  hit: VocalHit | null;
  isDownbeat: boolean;
  beatNum: number;
  barNum: number;
}

function BeatSlot({ hit, isDownbeat, beatNum }: BeatSlotProps) {
  const color = hit ? STATUS_COLOR[hit.status] : undefined;
  const symbol = hit ? STATUS_SYMBOL[hit.status] : '·';

  return (
    <div
      className="flex items-center justify-center text-[11px] font-mono rounded transition-all"
      style={{
        width: isDownbeat ? 22 : 18,
        height: isDownbeat ? 22 : 18,
        backgroundColor: hit ? (color + '22') : 'rgba(40,40,60,0.4)',
        border: `1px solid ${hit ? (color + '55') : 'rgba(60,60,80,0.4)'}`,
        color: hit ? color : '#333355',
        boxShadow: hit && hit.status !== 'off' ? `0 0 6px ${color}55` : undefined,
        fontWeight: isDownbeat ? 700 : 400,
      }}
      title={hit
        ? `Beat ${beatNum + 1}  t=${hit.time.toFixed(2)}s  Δ=${hit.offsetMs >= 0 ? '+' : ''}${hit.offsetMs.toFixed(1)}ms  ${STATUS_LABEL[hit.status]}`
        : `Beat ${beatNum + 1} — no hit`
      }
    >
      {symbol}
    </div>
  );
}

interface Props {
  result: AnalysisResult;
  /** For print layout: render without neon colors */
  printMode?: boolean;
}

export default function FlowMap({ result, printMode = false }: Props) {
  const { beats, vocalHits, beatInterval } = result;

  if (beats.length < 8) {
    return (
      <div className="text-zinc-600 text-xs font-mono p-3 border border-zinc-800 rounded-lg">
        Not enough beats detected for ABAB map (need ≥ 8 beats).
      </div>
    );
  }

  // Group beats into 4-beat bars
  const bars: Beat[][] = [];
  for (let i = 0; i + 3 < beats.length; i += 4) bars.push(beats.slice(i, i + 4));

  // Take first 8 bars → 4 lines of 2 bars each
  const usedBars = bars.slice(0, 8);
  const lines: Beat[][][] = [
    usedBars.slice(0, 2),
    usedBars.slice(2, 4),
    usedBars.slice(4, 6),
    usedBars.slice(6, 8),
  ];

  // For each beat slot, find the nearest vocal hit within half a beat
  function hitForBeat(beat: Beat): VocalHit | null {
    let best: VocalHit | null = null;
    let bestDist = beatInterval / 2;
    for (const h of vocalHits) {
      const d = Math.abs(h.time - beat.time);
      if (d < bestDist) { bestDist = d; best = h; }
    }
    return best;
  }

  const RHYME = ['A', 'B', 'A', 'B'];
  const RHYME_COLOR = ['#00ccff', '#ff00cc', '#00ccff', '#ff00cc'];

  return (
    <div className={`flex flex-col gap-3 ${printMode ? '' : 'border border-zinc-800 rounded-xl p-4 bg-zinc-950/80 shadow-[0_0_20px_rgba(0,200,255,0.05)]'}`}>
      {!printMode && (
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono tracking-widest text-cyan-600 uppercase">
            ◈ ABAB Flow Map — First 8 Bars
          </div>
          <div className="text-[10px] font-mono text-zinc-600">
            1 cell = 1 beat slot
          </div>
        </div>
      )}

      {/* Beat ruler header */}
      <div className="flex items-center gap-1 ml-10 mb-0.5">
        {[1,2,3,4,1,2,3,4].map((n, i) => (
          <div key={i}
            className="text-[8px] font-mono text-zinc-700 text-center"
            style={{ width: i % 4 === 0 ? 22 : 18 }}>
            {n}
          </div>
        ))}
        <div className="text-[8px] font-mono text-zinc-700 ml-1">|</div>
        {[1,2,3,4,1,2,3,4].map((n, i) => (
          <div key={i + 8}
            className="text-[8px] font-mono text-zinc-700 text-center"
            style={{ width: i % 4 === 0 ? 22 : 18 }}>
            {n}
          </div>
        ))}
      </div>

      {lines.map((lineBars, lineIdx) => {
        const allBeats = lineBars.flat();
        const slots = allBeats.map((beat, i) => ({ beat, hit: hitForBeat(beat), isDownbeat: i % 4 === 0, i }));

        const hitSlots  = slots.filter(s => s.hit);
        const nRushed   = hitSlots.filter(s => s.hit!.status === 'rushed').length;
        const nDragged  = hitSlots.filter(s => s.hit!.status === 'dragged').length;
        const nOff      = hitSlots.filter(s => s.hit!.status === 'off').length;
        const nIn       = hitSlots.filter(s => s.hit!.status === 'in-pocket').length;
        const fix       = lineFix(nRushed, nDragged, nOff, hitSlots.length);
        const lineAccuracy = hitSlots.length > 0 ? Math.round((nIn / hitSlots.length) * 100) : null;
        const rhymeColor   = RHYME_COLOR[lineIdx];

        return (
          <div key={lineIdx} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {/* Rhyme label */}
              <div
                className="w-8 text-center text-xs font-bold font-mono rounded shrink-0"
                style={{ color: rhymeColor, textShadow: printMode ? undefined : `0 0 8px ${rhymeColor}` }}
              >
                {RHYME[lineIdx]}
              </div>

              {/* Beat grid — first 2 bars */}
              <div className="flex gap-0.5">
                {slots.slice(0, 8).map(({ beat, hit, isDownbeat, i }) => (
                  <BeatSlot key={i} hit={hit} isDownbeat={isDownbeat} beatNum={i} barNum={Math.floor(i / 4)} />
                ))}
              </div>

              <div className="text-zinc-700 text-xs font-mono">|</div>

              {/* Beat grid — next 2 bars */}
              <div className="flex gap-0.5">
                {slots.slice(8).map(({ beat, hit, isDownbeat, i }) => (
                  <BeatSlot key={i} hit={hit} isDownbeat={isDownbeat} beatNum={i % 4} barNum={Math.floor(i / 4)} />
                ))}
              </div>

              {/* Accuracy badge */}
              {lineAccuracy !== null && (
                <div
                  className="ml-2 text-[10px] font-mono shrink-0"
                  style={{
                    color: lineAccuracy >= 70 ? '#00ff88' : lineAccuracy >= 40 ? '#ffcc00' : '#ff3344',
                  }}
                >
                  {lineAccuracy}%
                </div>
              )}

              {/* Mini status pills */}
              <div className="flex gap-1 ml-1 text-[9px] font-mono shrink-0">
                {nIn > 0     && <span style={{ color: '#00ff88' }}>✓{nIn}</span>}
                {nRushed > 0 && <span style={{ color: '#ff3344' }}>◀{nRushed}</span>}
                {nDragged > 0&& <span style={{ color: '#ffcc00' }}>▶{nDragged}</span>}
                {nOff > 0    && <span style={{ color: '#cc4455' }}>✕{nOff}</span>}
              </div>
            </div>

            {/* Fix suggestion */}
            {fix && (
              <div className="flex items-start gap-2 ml-10 text-[10px] font-mono text-yellow-500/80 leading-snug">
                <span className="shrink-0">↺</span>
                <span>{fix}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend row */}
      <div className="flex gap-4 mt-1 ml-10 text-[9px] font-mono text-zinc-600">
        <span style={{ color: '#00ff88' }}>✓ in pocket</span>
        <span style={{ color: '#ff3344' }}>◀ rushed</span>
        <span style={{ color: '#ffcc00' }}>▶ dragged</span>
        <span style={{ color: '#cc4455' }}>✕ off beat</span>
        <span>· no hit</span>
      </div>
    </div>
  );
}
