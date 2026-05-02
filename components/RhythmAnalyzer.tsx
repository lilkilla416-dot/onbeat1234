'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import FileUploader from './FileUploader';
import WaveformCanvas from './WaveformCanvas';
import MetricsPanel from './MetricsPanel';
import HitGrid from './HitGrid';

import { decodeAudioFile, computeWaveformPeaks, playTracks, stopPlayback, getPlaybackTimeSec, isPlaying } from '../lib/audioEngine';
import { detectBeats } from '../lib/beatDetector';
import { detectTransients } from '../lib/transientDetector';
import { analyzeVocals, buildAnalysisResult } from '../lib/pocketAnalyzer';
import type { AnalysisResult, AnalysisState, AudioTrack } from '../lib/types';

const PPS = 120; // pixels per second on waveform

interface WavePeaks { min: Float32Array; max: Float32Array }

export default function RhythmAnalyzer() {
  const [beatTrack,  setBeatTrack]  = useState<AudioTrack | null>(null);
  const [vocalTrack, setVocalTrack] = useState<AudioTrack | null>(null);
  const [beatPeaks,  setBeatPeaks]  = useState<WavePeaks | null>(null);
  const [vocalPeaks, setVocalPeaks] = useState<WavePeaks | null>(null);
  const [analysis,   setAnalysis]   = useState<AnalysisResult | null>(null);
  const [state,      setState]      = useState<AnalysisState>('idle');
  const [errorMsg,   setErrorMsg]   = useState('');
  const [playing,    setPlaying]    = useState(false);
  const [playTime,   setPlayTime]   = useState(0);
  const [seekSec,    setSeekSec]    = useState(0);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  // Polling loop for playhead
  useEffect(() => {
    function tick() {
      if (playingRef.current) {
        setPlayTime(getPlaybackTimeSec());
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const loadBeat = useCallback(async (file: File) => {
    try {
      setState('analyzing');
      setErrorMsg('');
      const buffer = await decodeAudioFile(file);
      const peaks = computeWaveformPeaks(buffer, PPS);
      setBeatPeaks(peaks);
      setBeatTrack({ buffer, name: file.name, duration: buffer.duration });
      setState('idle');
    } catch (e) {
      setErrorMsg(`Beat decode failed: ${e}`);
      setState('error');
    }
  }, []);

  const loadVocal = useCallback(async (file: File) => {
    try {
      setState('analyzing');
      setErrorMsg('');
      const buffer = await decodeAudioFile(file);
      const peaks = computeWaveformPeaks(buffer, PPS);
      setVocalPeaks(peaks);
      setVocalTrack({ buffer, name: file.name, duration: buffer.duration });
      setState('idle');
    } catch (e) {
      setErrorMsg(`Vocal decode failed: ${e}`);
      setState('error');
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!beatTrack) return;
    setState('analyzing');
    setErrorMsg('');
    try {
      const beatResult = await detectBeats(beatTrack.buffer);

      let result: AnalysisResult;
      if (vocalTrack) {
        const transients = await detectTransients(vocalTrack.buffer);
        const vocalHits  = analyzeVocals(transients, beatResult);
        result = buildAnalysisResult(beatResult, vocalHits);
      } else {
        result = buildAnalysisResult(beatResult, []);
      }

      setAnalysis(result);
      setState('done');
    } catch (e) {
      setErrorMsg(`Analysis failed: ${e}`);
      setState('error');
    }
  }, [beatTrack, vocalTrack]);

  const handlePlay = useCallback(() => {
    if (!beatTrack && !vocalTrack) return;
    playTracks(
      beatTrack?.buffer ?? null,
      vocalTrack?.buffer ?? null,
      seekSec,
      () => { setPlaying(false); playingRef.current = false; },
    );
    setPlaying(true);
    playingRef.current = true;
  }, [beatTrack, vocalTrack, seekSec]);

  const handleStop = useCallback(() => {
    stopPlayback();
    setSeekSec(getPlaybackTimeSec());
    setPlaying(false);
    playingRef.current = false;
  }, []);

  const handleRewind = useCallback(() => {
    stopPlayback();
    setSeekSec(0);
    setPlayTime(0);
    setPlaying(false);
    playingRef.current = false;
  }, []);

  const duration = beatTrack?.duration ?? vocalTrack?.duration ?? 60;
  const analysisReady = !!beatTrack;

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#050508] text-zinc-200
      font-mono select-none overflow-hidden">

      {/* ── Top bar ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3
        border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {['#ff3344','#ffcc00','#00ff88'].map(c => (
              <div key={c} className="w-3 h-3 rounded-full"
                style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }} />
            ))}
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest text-cyan-400"
              style={{ textShadow: '0 0 12px #00ccff88' }}>
              ON BEAT // RHYTHM ANALYZER
            </div>
            <div className="text-[10px] text-zinc-600 tracking-widest">
              DSP-POWERED POCKET DETECTION ENGINE v1.0
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          {state === 'analyzing' && (
            <span className="animate-pulse text-cyan-400">⬡ ANALYZING...</span>
          )}
          {state === 'done' && (
            <span className="text-green-400">◉ ANALYSIS COMPLETE</span>
          )}
          {state === 'error' && (
            <span className="text-red-400">⚠ {errorMsg}</span>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ─────────────────────────────────────── */}
        <aside className="flex flex-col gap-4 w-64 shrink-0 p-4 border-r border-zinc-800
          overflow-y-auto bg-zinc-950/60">

          <div className="text-[10px] text-zinc-600 tracking-widest uppercase">
            ◈ Track Input
          </div>

          <FileUploader
            label="Beat Track"
            onFile={loadBeat}
            loaded={!!beatTrack}
            fileName={beatTrack?.name}
          />
          <FileUploader
            label="Vocal Track"
            onFile={loadVocal}
            loaded={!!vocalTrack}
            fileName={vocalTrack?.name}
          />

          <button
            onClick={runAnalysis}
            disabled={!analysisReady || state === 'analyzing'}
            className={`
              w-full py-2.5 rounded-lg border font-mono text-sm tracking-widest uppercase
              transition-all duration-200
              ${analysisReady && state !== 'analyzing'
                ? 'border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_16px_#00ccff44] cursor-pointer'
                : 'border-zinc-800 text-zinc-700 cursor-not-allowed'}
            `}
          >
            {state === 'analyzing' ? '⬡ ANALYZING…' : '▶ ANALYZE'}
          </button>

          {/* Playback controls */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleRewind}
              className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400
                hover:border-zinc-500 hover:text-zinc-200 transition-colors text-sm"
              title="Rewind"
            >⏮</button>
            <button
              onClick={playing ? handleStop : handlePlay}
              disabled={!beatTrack && !vocalTrack}
              className={`
                flex-1 py-2 rounded-lg border text-sm font-bold transition-all
                ${(!beatTrack && !vocalTrack)
                  ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                  : playing
                    ? 'border-red-700 text-red-400 hover:bg-red-900/20'
                    : 'border-green-700 text-green-400 hover:bg-green-900/20'}
              `}
              title={playing ? 'Stop' : 'Play'}
            >
              {playing ? '⏹' : '▶'}
            </button>
          </div>

          {/* Playhead time */}
          <div className="text-center text-sm text-zinc-500">
            {formatTime(playing ? playTime : seekSec)}
            <span className="text-zinc-700"> / {formatTime(duration)}</span>
          </div>

          {/* Pocket legend */}
          <div className="mt-auto flex flex-col gap-1.5 pt-4 border-t border-zinc-800">
            <div className="text-[10px] text-zinc-600 tracking-widest uppercase mb-1">
              ◈ Pocket Key
            </div>
            {[
              { color: '#00ff88', label: 'In Pocket',  sub: '±30 ms' },
              { color: '#ff3344', label: 'Rushed',     sub: '–31 to –80 ms' },
              { color: '#ffcc00', label: 'Dragged',    sub: '+31 to +80 ms' },
              { color: '#444455', label: 'Off Beat',   sub: '> ±80 ms' },
            ].map(({ color, label, sub }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                <div>
                  <div className="text-[11px] text-zinc-300">{label}</div>
                  <div className="text-[9px] text-zinc-600">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <main className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden gap-0">

          {/* Beat waveform */}
          <div className="border-b border-zinc-900">
            <SectionLabel label="Beat Track" extra={beatTrack ? `${beatTrack.duration.toFixed(1)}s` : ''} />
            <WaveformCanvas
              waveMin={beatPeaks?.min ?? null}
              waveMax={beatPeaks?.max ?? null}
              duration={beatTrack?.duration ?? 30}
              sampleRate={beatTrack?.buffer.sampleRate ?? 44100}
              pixelsPerSecond={PPS}
              beats={analysis?.beats}
              pocketWindowMs={analysis?.pocketWindow}
              playheadSec={playing ? playTime : seekSec}
              label="beat"
              color="#00ccff"
              height={110}
            />
          </div>

          {/* Vocal waveform */}
          <div className="border-b border-zinc-900">
            <SectionLabel label="Vocal Track" extra={vocalTrack ? `${vocalTrack.duration.toFixed(1)}s` : ''} />
            <WaveformCanvas
              waveMin={vocalPeaks?.min ?? null}
              waveMax={vocalPeaks?.max ?? null}
              duration={vocalTrack?.duration ?? beatTrack?.duration ?? 30}
              sampleRate={vocalTrack?.buffer.sampleRate ?? 44100}
              pixelsPerSecond={PPS}
              beats={analysis?.beats}
              vocalHits={analysis?.vocalHits}
              pocketWindowMs={analysis?.pocketWindow}
              playheadSec={playing ? playTime : seekSec}
              label="vocal"
              color="#ff00cc"
              height={110}
            />
          </div>

          {/* Metrics + hit grid */}
          <div className="flex flex-col lg:flex-row gap-4 p-4">
            <div className="flex-1 min-w-0">
              <MetricsPanel result={analysis} />
            </div>
            <div className="flex-1 min-w-0">
              <HitGrid hits={analysis?.vocalHits ?? []} />
            </div>
          </div>

          {/* BPM indicator strip */}
          {analysis && (
            <div className="px-4 pb-4">
              <BpmStrip bpm={analysis.bpm} playing={playing} playTime={playing ? playTime : seekSec} beatInterval={analysis.beatInterval} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Small helper sub-components ─────────────────────────────────── */

function SectionLabel({ label, extra }: { label: string; extra?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950/80
      border-b border-zinc-900">
      <div className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
        {label}
      </div>
      {extra && <div className="text-[10px] font-mono text-zinc-700">{extra}</div>}
    </div>
  );
}

function BpmStrip({ bpm, playing, playTime, beatInterval }: {
  bpm: number;
  playing: boolean;
  playTime: number;
  beatInterval: number;
}) {
  // Phase of current beat: 0..1
  const phase = (playTime % beatInterval) / beatInterval;
  const flash = playing && phase < 0.15;

  return (
    <div className="flex items-center gap-4 border border-zinc-800 rounded-xl px-5 py-3
      bg-zinc-950/80">
      <div className="text-[10px] font-mono text-zinc-600 tracking-widest">BPM</div>
      <div
        className="text-3xl font-mono font-bold transition-all duration-75"
        style={{
          color: flash ? '#00ff88' : '#00ccff',
          textShadow: flash
            ? '0 0 20px #00ff88, 0 0 40px #00ff8844'
            : '0 0 12px #00ccff55',
        }}
      >
        {bpm.toFixed(1)}
      </div>

      {/* Mini beat grid: 16 dots = one bar of 4/4 at 4 subdivisions */}
      <div className="flex gap-1 items-center ml-4">
        {Array.from({ length: 16 }, (_, i) => {
          const dotPhase = i / 16;
          const active = playing && Math.abs(phase - dotPhase) < 0.03;
          const isDownbeat = i % 4 === 0;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-75"
              style={{
                width:  isDownbeat ? 8 : 5,
                height: isDownbeat ? 8 : 5,
                backgroundColor: active
                  ? '#00ff88'
                  : isDownbeat ? '#00ccff44' : '#33334455',
                boxShadow: active ? '0 0 8px #00ff88' : undefined,
              }}
            />
          );
        })}
      </div>

      <div className="ml-auto text-[10px] font-mono text-zinc-600">
        {(beatInterval * 1000).toFixed(1)} ms/beat
      </div>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${ms}`;
}
