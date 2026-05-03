import { iirFilter, toMono } from './audioEngine';
import type { Beat } from './types';

const FRAME_SIZE = 512;
const HOP_SIZE = 256;
const BPM_MIN = 60;
const BPM_MAX = 200;

/** Compute per-frame RMS energy. */
function computeEnergy(data: Float32Array): Float32Array {
  const numFrames = Math.floor((data.length - FRAME_SIZE) / HOP_SIZE) + 1;
  const energy = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    const start = f * HOP_SIZE;
    let sum = 0;
    for (let i = start; i < start + FRAME_SIZE; i++) {
      sum += data[i] * data[i];
    }
    energy[f] = Math.sqrt(sum / FRAME_SIZE);
  }
  return energy;
}

/** Half-wave rectified first-order difference = onset strength. */
function onsetStrength(energy: Float32Array): Float32Array {
  const strength = new Float32Array(energy.length);
  for (let i = 1; i < energy.length; i++) {
    strength[i] = Math.max(0, energy[i] - energy[i - 1]);
  }
  return strength;
}

/** Smooth with a simple box filter of width `w`. */
function smooth(arr: Float32Array, w: number): Float32Array {
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(arr.length - 1, i + w); j++) {
      sum += arr[j]; count++;
    }
    out[i] = sum / count;
  }
  return out;
}

/** Find peaks above an adaptive threshold with minimum distance `minGapFrames`. */
function findPeaks(strength: Float32Array, minGapFrames: number): number[] {
  const smoothed = smooth(strength, 8);
  const windowSize = 32;
  const peaks: number[] = [];
  let lastPeak = -minGapFrames;

  for (let i = 1; i < strength.length - 1; i++) {
    if (i - lastPeak < minGapFrames) continue;

    // local max
    if (strength[i] <= strength[i - 1] || strength[i] <= strength[i + 1]) continue;

    // adaptive threshold: local mean + 1.5 * excess above smoothed
    let localMean = 0;
    const lo = Math.max(0, i - windowSize);
    const hi = Math.min(strength.length, i + windowSize);
    for (let j = lo; j < hi; j++) localMean += strength[j];
    localMean /= (hi - lo);

    const threshold = localMean + 0.5 * smoothed[i];
    if (strength[i] > threshold) {
      peaks.push(i);
      lastPeak = i;
    }
  }
  return peaks;
}

/** Convert frame index to time in seconds. */
function frameToTime(frame: number, sampleRate: number): number {
  return (frame * HOP_SIZE + FRAME_SIZE / 2) / sampleRate;
}

/** Estimate BPM from inter-onset intervals using a histogram. */
function estimateBPM(peakFrames: number[], sampleRate: number): number {
  if (peakFrames.length < 4) return 120;

  const bpmBins = new Float32Array(BPM_MAX + 1);
  for (let i = 1; i < peakFrames.length; i++) {
    const ioi = frameToTime(peakFrames[i], sampleRate) - frameToTime(peakFrames[i - 1], sampleRate);
    if (ioi <= 0) continue;

    // Consider the IOI and common multiples / subdivisions
    for (const mult of [1, 2, 0.5, 3, 1.5, 0.333]) {
      const bpm = Math.round(60 / (ioi * mult));
      if (bpm >= BPM_MIN && bpm <= BPM_MAX) {
        bpmBins[bpm] += 1 / mult; // weight subdivisions less
      }
    }
  }

  // Smooth the histogram
  const smoothed = smooth(bpmBins, 2);
  let best = BPM_MIN;
  for (let b = BPM_MIN; b <= BPM_MAX; b++) {
    if (smoothed[b] > smoothed[best]) best = b;
  }
  return best;
}

/** Given a BPM and onset peaks, find the best phase offset (seconds). */
function findBestPhase(
  bpm: number,
  peakFrames: number[],
  totalFrames: number,
  sampleRate: number,
): number {
  const beatInterval = 60 / bpm;
  const peakTimes = peakFrames.map(f => frameToTime(f, sampleRate));
  const duration = frameToTime(totalFrames, sampleRate);

  let bestPhase = 0;
  let bestScore = -Infinity;
  const steps = 64;

  for (let s = 0; s < steps; s++) {
    const phase = (s / steps) * beatInterval;
    let score = 0;
    let beat = phase;
    while (beat < duration) {
      // score = sum of 1/distance to nearest peak, within half a beat
      const halfInterval = beatInterval / 2;
      let minDist = halfInterval;
      for (const t of peakTimes) {
        const d = Math.abs(t - beat);
        if (d < minDist) minDist = d;
      }
      score += 1 - minDist / halfInterval;
      beat += beatInterval;
    }
    if (score > bestScore) { bestScore = score; bestPhase = phase; }
  }
  return bestPhase;
}

export interface BeatDetectionResult {
  bpm: number;
  beatInterval: number;
  beats: Beat[];
}

export async function detectBeats(buffer: AudioBuffer): Promise<BeatDetectionResult> {
  const sr = buffer.sampleRate;

  // Isolate low-frequency (kick) content
  const mono = toMono(buffer);
  const lowpassed = iirFilter(mono, 'lowpass', 200, sr);

  const energy = computeEnergy(lowpassed);
  const strength = onsetStrength(energy);

  // Minimum gap: ~0.25s between beats (corresponds to 240 BPM max)
  const minGapFrames = Math.round((0.25 * sr) / HOP_SIZE);
  const peakFrames = findPeaks(strength, minGapFrames);

  const bpm = estimateBPM(peakFrames, sr);
  const beatInterval = 60 / bpm;
  const phase = findBestPhase(bpm, peakFrames, energy.length, sr);

  // Generate the complete beat grid
  const beats: Beat[] = [];
  let t = phase;
  while (t < buffer.duration) {
    // Confidence: how close the nearest onset peak is to this beat
    let minDist = beatInterval / 2;
    for (const pf of peakFrames) {
      const pt = frameToTime(pf, sr);
      const d = Math.abs(pt - t);
      if (d < minDist) minDist = d;
    }
    const confidence = 1 - (minDist / (beatInterval / 2));
    beats.push({ time: t, confidence: Math.max(0, confidence) });
    t += beatInterval;
  }

  // Walk back to find any beats before the first detected phase
  let tBack = phase - beatInterval;
  while (tBack >= 0) {
    beats.unshift({ time: tBack, confidence: 0.5 });
    tBack -= beatInterval;
  }
  beats.sort((a, b) => a.time - b.time);

  return { bpm, beatInterval, beats };
}
