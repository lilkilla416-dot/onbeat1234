export type PocketStatus = 'in-pocket' | 'rushed' | 'dragged' | 'off';

export interface Beat {
  time: number;       // seconds from track start
  confidence: number; // 0–1
}

export interface VocalHit {
  time: number;       // seconds
  strength: number;   // 0–1 normalised onset strength
  nearestBeat: number; // seconds
  offsetMs: number;   // ms from nearest beat (negative = rushed, positive = dragged)
  status: PocketStatus;
}

export interface AnalysisResult {
  bpm: number;
  beatInterval: number;  // seconds per beat
  beats: Beat[];
  vocalHits: VocalHit[];
  accuracy: number;       // 0–100 percent in-pocket
  avgOffsetMs: number;    // mean signed offset (negative = rushes, positive = drags)
  pocketWindow: number;   // ±ms window considered "in pocket"
}

export interface AudioTrack {
  buffer: AudioBuffer;
  name: string;
  duration: number; // seconds
}

// Canvas waveform data pre-computed for fast rendering
export interface WaveformPeaks {
  min: Float32Array;
  max: Float32Array;
  sampleRate: number;
  duration: number;
  pixelsPerSecond: number;
}

export type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error';
