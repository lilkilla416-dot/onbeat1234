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
  'in-pocket': '#34d399',
  rushed:      '#f87171',
  dragged:     '#fbbf24',
  off:         '#4b5563',
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
  const color  = hit ? STATUS_COLOR[hit.status] : undefined;
  const symbol = hit ? STATUS_SYMBOL[hit.status] : '·';
  const isGood = hit?.status === 'in-pocket';

  return (
    <div
      className="flex items-center justify-center rounded cursor-default select-none"
      style={{
        width:  isDownbeat ? 22 : 18,
        height: isDownbeat ? 22 : 18,
        fontSize: 10,
        fontFamily: 'var(--font-geist-mono)',
        fontWeight: isDownbeat ? 600 : 400,
        backgroundColor: hit ? (color + (isGood ? '28' : '18')) : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hit ? (color + (isGood ? '55' : '33')) : 'rgba(255,255,255,0.07)'}`,
        color: hit ? color : 'rgba(255,255,255,0.15)',
        borderRadius: isDownbeat ? 5 : 4,
      }}
      title={hit
        ? `Beat ${beatNum + 1}  t=${hit.time.toFixed(2)}s  Δ=${hit.offsetMs >= 0 ? '+' : ''}${hit.offsetMs.toFixed(1)}ms  ${STATUS_LABEL[hit.status]}`
        : `Beat ${beatNum + 1} — no hit`}
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
  const RHYME_COLOR = ['#818cf8', '#c084fc', '#818cf8', '#c084fc'];

  return (
    <div className={printMode ? 'flex flex-col gap-2' : 'flex flex-col gap-3 rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]'}>
      {!printMode && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/35 font-medium">ABAB Flow — First 8 Bars</span>
          <span className="text-[10px] text-white/20"
            style={{ fontFamily: 'var(--font-geist-mono)' }}>1 cell = 1 beat</span>
        </div>
      )}

      {/* Beat ruler */}
      <div className="flex items-center gap-1 ml-9">
        {[1,2,3,4,1,2,3,4].map((n, i) => (
          <div key={i} className="text-[8px] text-white/20 text-center"
            style={{ width: i % 4 === 0 ? 22 : 18, fontFamily: 'var(--font-geist-mono)' }}>
            {n}
          </div>
        ))}
        <div className="text-[8px] text-white/15 mx-0.5">|</div>
        {[1,2,3,4,1,2,3,4].map((n, i) => (
          <div key={i+8} className="text-[8px] text-white/20 text-center"
            style={{ width: i % 4 === 0 ? 22 : 18, fontFamily: 'var(--font-geist-mono)' }}>
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
        const lineAcc   = hitSlots.length > 0 ? Math.round((nIn / hitSlots.length) * 100) : null;
        const rColor    = RHYME_COLOR[lineIdx];

        return (
          <div key={lineIdx} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {/* Rhyme badge */}
              <div className="w-7 text-center text-[11px] font-semibold shrink-0 rounded-md py-0.5"
                style={{ color: rColor, backgroundColor: rColor + '18',
                  fontFamily: 'var(--font-geist-mono)' }}>
                {RHYME[lineIdx]}
              </div>

              {/* Beat grid — bars 1-2 */}
              <div className="flex gap-0.5">
                {slots.slice(0, 8).map(({ beat, hit, isDownbeat, i }) => (
                  <BeatSlot key={i} hit={hit} isDownbeat={isDownbeat} beatNum={i} barNum={0} />
                ))}
              </div>

              <div className="text-white/15 text-xs">|</div>

              {/* Beat grid — bars 3-4 */}
              <div className="flex gap-0.5">
                {slots.slice(8).map(({ beat, hit, isDownbeat, i }) => (
                  <BeatSlot key={i} hit={hit} isDownbeat={isDownbeat} beatNum={i % 4} barNum={1} />
                ))}
              </div>

              {lineAcc !== null && (
                <span className="ml-2 text-[10px] tabular-nums shrink-0"
                  style={{
                    fontFamily: 'var(--font-geist-mono)',
                    color: lineAcc >= 70 ? '#34d399' : lineAcc >= 40 ? '#fbbf24' : '#f87171',
                  }}>
                  {lineAcc}%
                </span>
              )}

              <div className="flex gap-1 ml-0.5 text-[9px] shrink-0"
                style={{ fontFamily: 'var(--font-geist-mono)' }}>
                {nIn > 0     && <span style={{ color: '#34d399' }}>{nIn}✓</span>}
                {nRushed > 0 && <span style={{ color: '#f87171' }}>{nRushed}◀</span>}
                {nDragged > 0&& <span style={{ color: '#fbbf24' }}>{nDragged}▶</span>}
                {nOff > 0    && <span style={{ color: '#6b7280' }}>{nOff}✕</span>}
              </div>
            </div>

            {fix && (
              <div className="flex items-start gap-1.5 ml-9 text-[10px] text-amber-400/60 leading-snug">
                <span className="shrink-0 mt-px">↺</span>
                <span>{fix}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex gap-3 mt-1 ml-9 text-[9px] text-white/25 pt-2 border-t border-white/[0.05]">
        {[
          { color: '#34d399', label: '✓ in pocket' },
          { color: '#f87171', label: '◀ rushed' },
          { color: '#fbbf24', label: '▶ dragged' },
          { color: '#6b7280', label: '✕ off beat' },
          { color: 'rgba(255,255,255,0.2)', label: '· no hit' },
        ].map(({ color, label }) => (
          <span key={label} style={{ color }}>{label}</span>
        ))}
      </div>
    </div>
  );
}
