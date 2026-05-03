import { iirFilter, toMono } from './audioEngine';

const FRAME_SIZE = 256;
const HOP_SIZE = 128;

function computeRMS(data: Float32Array): Float32Array {
  const numFrames = Math.floor((data.length - FRAME_SIZE) / HOP_SIZE) + 1;
  const rms = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    const start = f * HOP_SIZE;
    let sum = 0;
    for (let i = start; i < start + FRAME_SIZE; i++) {
      sum += data[i] * data[i];
    }
    rms[f] = Math.sqrt(sum / FRAME_SIZE);
  }
  return rms;
}

/** Spectral flux-style onset: half-wave rectified positive energy jump. */
function onsetEnvelope(rms: Float32Array): Float32Array {
  const env = new Float32Array(rms.length);
  for (let i = 1; i < rms.length; i++) {
    env[i] = Math.max(0, rms[i] - rms[i - 1]);
  }
  return env;
}

function frameToTime(frame: number, sampleRate: number): number {
  return (frame * HOP_SIZE + FRAME_SIZE / 2) / sampleRate;
}

function localMean(arr: Float32Array, center: number, radius: number): number {
  let sum = 0, count = 0;
  const lo = Math.max(0, center - radius);
  const hi = Math.min(arr.length - 1, center + radius);
  for (let i = lo; i <= hi; i++) { sum += arr[i]; count++; }
  return count > 0 ? sum / count : 0;
}

export interface TransientResult {
  times: number[];        // seconds
  strengths: number[];    // 0–1 normalised
}

export async function detectTransients(
  buffer: AudioBuffer,
  minGapSec = 0.05,
): Promise<TransientResult> {
  const sr = buffer.sampleRate;

  // High-pass to remove the backing beat/kick and isolate vocal content
  const mono = toMono(buffer);
  const highpassed = iirFilter(mono, 'highpass', 300, sr);

  const rms = computeRMS(highpassed);
  const env = onsetEnvelope(rms);

  // Normalise envelope
  let maxVal = 0;
  for (let i = 0; i < env.length; i++) if (env[i] > maxVal) maxVal = env[i];
  if (maxVal > 0) for (let i = 0; i < env.length; i++) env[i] /= maxVal;

  const minGapFrames = Math.round((minGapSec * sr) / HOP_SIZE);
  const times: number[] = [];
  const strengths: number[] = [];
  let lastPeak = -minGapFrames;

  for (let i = 1; i < env.length - 1; i++) {
    if (i - lastPeak < minGapFrames) continue;
    if (env[i] <= env[i - 1] || env[i] <= env[i + 1]) continue;

    // Adaptive threshold: local mean + multiplier
    const threshold = localMean(env, i, 24) * 1.4 + 0.04;
    if (env[i] > threshold) {
      times.push(frameToTime(i, sr));
      strengths.push(env[i]);
      lastPeak = i;
    }
  }

  // Normalise strengths within [0,1]
  let maxS = 0;
  for (const s of strengths) if (s > maxS) maxS = s;
  const normStrengths = maxS > 0 ? strengths.map(s => s / maxS) : strengths;

  return { times, strengths: normStrengths };
}
