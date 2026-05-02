'use client';

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new AudioContext();
  }
  return _ctx;
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const arrayBuffer = await file.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

// ----- Playback engine -----

interface PlaybackSession {
  beatSource: AudioBufferSourceNode | null;
  vocalSource: AudioBufferSourceNode | null;
  startedAt: number;    // AudioContext.currentTime when play was called
  offsetSec: number;    // track offset we started playing from
}

let session: PlaybackSession = {
  beatSource: null,
  vocalSource: null,
  startedAt: 0,
  offsetSec: 0,
};

export function playTracks(
  beatBuffer: AudioBuffer | null,
  vocalBuffer: AudioBuffer | null,
  seekSec = 0,
  onEnded?: () => void,
) {
  stopPlayback();
  const ctx = getCtx();
  session.startedAt = ctx.currentTime;
  session.offsetSec = seekSec;

  if (beatBuffer) {
    const src = ctx.createBufferSource();
    src.buffer = beatBuffer;
    src.connect(ctx.destination);
    src.start(0, seekSec);
    session.beatSource = src;
    if (onEnded) src.onended = onEnded;
  }

  if (vocalBuffer) {
    const src = ctx.createBufferSource();
    src.buffer = vocalBuffer;
    src.connect(ctx.destination);
    src.start(0, seekSec);
    session.vocalSource = src;
  }
}

export function stopPlayback() {
  try { session.beatSource?.stop(); } catch (_) {}
  try { session.vocalSource?.stop(); } catch (_) {}
  session.beatSource = null;
  session.vocalSource = null;
}

export function getPlaybackTimeSec(): number {
  if (!session.beatSource && !session.vocalSource) return session.offsetSec;
  const ctx = getCtx();
  return session.offsetSec + (ctx.currentTime - session.startedAt);
}

export function isPlaying(): boolean {
  return session.beatSource !== null || session.vocalSource !== null;
}

// ----- Mono mix helper -----

/** Returns a mono Float32Array from an AudioBuffer, mixing all channels. */
export function toMono(buffer: AudioBuffer): Float32Array {
  const len = buffer.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const ch = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += ch[i];
  }
  const scale = 1 / buffer.numberOfChannels;
  for (let i = 0; i < len; i++) mono[i] *= scale;
  return mono;
}

/** Applies a simple IIR filter to a Float32Array in-place.
 *  type: 'lowpass' | 'highpass', fc in Hz, sampleRate in Hz. */
export function iirFilter(
  data: Float32Array,
  type: 'lowpass' | 'highpass',
  fc: number,
  sampleRate: number,
): Float32Array {
  const RC = 1 / (2 * Math.PI * fc);
  const dt = 1 / sampleRate;
  const alpha = type === 'lowpass' ? dt / (RC + dt) : RC / (RC + dt);
  const out = new Float32Array(data.length);
  out[0] = data[0];
  if (type === 'lowpass') {
    for (let i = 1; i < data.length; i++) {
      out[i] = alpha * data[i] + (1 - alpha) * out[i - 1];
    }
  } else {
    for (let i = 1; i < data.length; i++) {
      out[i] = alpha * (out[i - 1] + data[i] - data[i - 1]);
    }
  }
  return out;
}

/** Pre-compute waveform peaks for canvas rendering at given pixels-per-second. */
export function computeWaveformPeaks(
  buffer: AudioBuffer,
  pixelsPerSecond: number,
): { min: Float32Array; max: Float32Array } {
  const mono = toMono(buffer);
  const totalPixels = Math.ceil(buffer.duration * pixelsPerSecond);
  const samplesPerPixel = mono.length / totalPixels;
  const min = new Float32Array(totalPixels);
  const max = new Float32Array(totalPixels);

  for (let px = 0; px < totalPixels; px++) {
    const start = Math.floor(px * samplesPerPixel);
    const end = Math.min(Math.floor((px + 1) * samplesPerPixel), mono.length);
    let lo = 0, hi = 0;
    for (let i = start; i < end; i++) {
      if (mono[i] < lo) lo = mono[i];
      if (mono[i] > hi) hi = mono[i];
    }
    min[px] = lo;
    max[px] = hi;
  }
  return { min, max };
}
