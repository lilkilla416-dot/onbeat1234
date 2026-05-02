import type { Beat, VocalHit, PocketStatus, AnalysisResult } from './types';
import type { TransientResult } from './transientDetector';
import type { BeatDetectionResult } from './beatDetector';

// Timing window definitions (milliseconds from nearest beat)
const POCKET_WINDOW_MS = 30;   // ±30 ms = "in the pocket" (green)
const RUSH_DRAG_MS = 80;       // ±31–80 ms = rushed/dragged (red/yellow)
                                // beyond ±80 ms = "off" (dim)

function classifyOffset(offsetMs: number): PocketStatus {
  const abs = Math.abs(offsetMs);
  if (abs <= POCKET_WINDOW_MS) return 'in-pocket';
  if (abs <= RUSH_DRAG_MS) return offsetMs < 0 ? 'rushed' : 'dragged';
  return 'off';
}

/** Find the beat time that is nearest to `t`. */
function nearestBeat(t: number, beats: Beat[]): Beat {
  let best = beats[0];
  let bestDist = Math.abs(t - beats[0].time);
  for (let i = 1; i < beats.length; i++) {
    const d = Math.abs(t - beats[i].time);
    if (d < bestDist) { bestDist = d; best = beats[i]; }
  }
  return best;
}

export function analyzeVocals(
  transients: TransientResult,
  beatResult: BeatDetectionResult,
): VocalHit[] {
  const { beats } = beatResult;
  return transients.times.map((t, idx) => {
    const nb = nearestBeat(t, beats);
    const offsetMs = (t - nb.time) * 1000;
    return {
      time: t,
      strength: transients.strengths[idx],
      nearestBeat: nb.time,
      offsetMs,
      status: classifyOffset(offsetMs),
    };
  });
}

export function buildAnalysisResult(
  beatResult: BeatDetectionResult,
  vocalHits: VocalHit[],
): AnalysisResult {
  const inPocket = vocalHits.filter(h => h.status === 'in-pocket').length;
  const accuracy = vocalHits.length > 0
    ? Math.round((inPocket / vocalHits.length) * 100)
    : 0;

  const avgOffsetMs = vocalHits.length > 0
    ? vocalHits.reduce((s, h) => s + h.offsetMs, 0) / vocalHits.length
    : 0;

  return {
    bpm: beatResult.bpm,
    beatInterval: beatResult.beatInterval,
    beats: beatResult.beats,
    vocalHits,
    accuracy,
    avgOffsetMs,
    pocketWindow: POCKET_WINDOW_MS,
  };
}

/** Returns per-bar accuracy: array of { barIndex, accuracy }. */
export function perBarAccuracy(
  result: AnalysisResult,
  beatsPerBar = 4,
): Array<{ barIndex: number; accuracy: number; hits: VocalHit[] }> {
  if (result.beats.length === 0) return [];

  const bars: Map<number, VocalHit[]> = new Map();
  for (const hit of result.vocalHits) {
    // Find which beat index is nearest
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < result.beats.length; i++) {
      const d = Math.abs(result.beats[i].time - hit.nearestBeat);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    const barIdx = Math.floor(nearestIdx / beatsPerBar);
    if (!bars.has(barIdx)) bars.set(barIdx, []);
    bars.get(barIdx)!.push(hit);
  }

  const out: Array<{ barIndex: number; accuracy: number; hits: VocalHit[] }> = [];
  bars.forEach((hits, barIndex) => {
    const inP = hits.filter(h => h.status === 'in-pocket').length;
    out.push({ barIndex, accuracy: Math.round((inP / hits.length) * 100), hits });
  });
  out.sort((a, b) => a.barIndex - b.barIndex);
  return out;
}
