'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import FileUploader from './FileUploader';
import TimeRuler from './TimeRuler';
import WaveformCanvas from './WaveformCanvas';
import MetricsPanel from './MetricsPanel';
import HitGrid from './HitGrid';
import LyricCoach from './LyricCoach';
import AnalysisReport from './AnalysisReport';

import {
  decodeAudioFile, computeWaveformPeaks,
  playTracks, stopPlayback, getPlaybackTimeSec,
} from '../lib/audioEngine';
import { detectBeats } from '../lib/beatDetector';
import { detectTransients } from '../lib/transientDetector';
import { analyzeVocals, buildAnalysisResult } from '../lib/pocketAnalyzer';
import type { AnalysisResult, AnalysisState, AudioTrack } from '../lib/types';

const PPS = 120;
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
  const [scrollPx,   setScrollPx]   = useState(0);

  const rafRef     = useRef<number | null>(null);
  const playingRef = useRef(false);
  const mainRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function tick() {
      if (playingRef.current) {
        const t = getPlaybackTimeSec();
        setPlayTime(t);
        const px = t * PPS;
        const vw = mainRef.current?.clientWidth ?? 900;
        setScrollPx(prev =>
          px < prev + 20 || px > prev + vw - 60
            ? Math.max(0, px - vw * 0.3)
            : prev
        );
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const loadBeat = useCallback(async (file: File) => {
    try {
      setState('analyzing'); setErrorMsg('');
      const buf = await decodeAudioFile(file);
      setBeatPeaks(computeWaveformPeaks(buf, PPS));
      setBeatTrack({ buffer: buf, name: file.name, duration: buf.duration });
      setState('idle');
    } catch (e) { setErrorMsg(String(e)); setState('error'); }
  }, []);

  const loadVocal = useCallback(async (file: File) => {
    try {
      setState('analyzing'); setErrorMsg('');
      const buf = await decodeAudioFile(file);
      setVocalPeaks(computeWaveformPeaks(buf, PPS));
      setVocalTrack({ buffer: buf, name: file.name, duration: buf.duration });
      setState('idle');
    } catch (e) { setErrorMsg(String(e)); setState('error'); }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!beatTrack) return;
    setState('analyzing'); setErrorMsg('');
    try {
      const br = await detectBeats(beatTrack.buffer);
      const result = vocalTrack
        ? buildAnalysisResult(br, analyzeVocals(await detectTransients(vocalTrack.buffer), br))
        : buildAnalysisResult(br, []);
      setAnalysis(result);
      setState('done');
    } catch (e) { setErrorMsg(String(e)); setState('error'); }
  }, [beatTrack, vocalTrack]);

  const handlePlay = useCallback(() => {
    if (!beatTrack && !vocalTrack) return;
    playTracks(beatTrack?.buffer ?? null, vocalTrack?.buffer ?? null, seekSec,
      () => { setPlaying(false); playingRef.current = false; });
    setPlaying(true); playingRef.current = true;
  }, [beatTrack, vocalTrack, seekSec]);

  const handleStop = useCallback(() => {
    stopPlayback();
    setSeekSec(getPlaybackTimeSec());
    setPlaying(false); playingRef.current = false;
  }, []);

  const handleRewind = useCallback(() => {
    stopPlayback();
    setSeekSec(0); setPlayTime(0); setScrollPx(0);
    setPlaying(false); playingRef.current = false;
  }, []);

  const handleScroll = useCallback((px: number) => setScrollPx(px), []);

  const duration    = beatTrack?.duration ?? vocalTrack?.duration ?? 60;
  const displayTime = playing ? playTime : seekSec;

  return (
    <>
      <AnalysisReport result={analysis} beatName={beatTrack?.name} vocalName={vocalTrack?.name} />

      <div id="app-ui" className="flex flex-col h-full"
        style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-geist-sans, system-ui)' }}>

        {/* ── Header bar ────────────────────────────────── */}
        <header className="flex items-center gap-4 px-5 h-11 shrink-0"
          style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)' }}>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke="var(--accent-2)" strokeWidth="1.5"/>
              <circle cx="9" cy="9" r="2.5" fill="var(--accent)"/>
              {[[9,1,9,4],[9,14,9,17],[1,9,4,9],[14,9,17,9]].map(([x1,y1,x2,y2],i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="var(--accent-2)" strokeWidth="1.5" strokeLinecap="round"/>
              ))}
            </svg>
            <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>On Beat</span>
          </div>

          <div className="w-px h-4" style={{ background: 'var(--b2)' }} />
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Rhythm Analyzer</span>

          <div className="flex-1" />

          {state === 'analyzing' && (
            <span className="text-xs animate-soft-pulse" style={{ color: 'var(--accent-2)' }}>
              Analyzing…
            </span>
          )}
          {state === 'done' && (
            <span className="text-xs" style={{ color: 'var(--green)' }}>Ready</span>
          )}
          {state === 'error' && (
            <span className="text-xs truncate max-w-xs" style={{ color: 'var(--red)' }}>{errorMsg}</span>
          )}

          {analysis && (
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-150 hover:opacity-80"
              style={{ background: 'var(--s3)', border: '1px solid var(--b2)', color: 'var(--text-2)' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v6M3 4.5l2.5 2.5 2.5-2.5M1 8.5v1A.5.5 0 001.5 10h8a.5.5 0 00.5-.5V8.5"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export PDF
            </button>
          )}
        </header>

        {/* ── Body ──────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Sidebar ──────────────────────────────────── */}
          <aside className="flex flex-col w-52 shrink-0"
            style={{ background: 'var(--s1)', borderRight: '1px solid var(--b1)' }}>

            {/* Track loaders */}
            <div className="p-4 flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-3)' }}>Tracks</div>
              <FileUploader label="Beat Track"  onFile={loadBeat}
                loaded={!!beatTrack}  fileName={beatTrack?.name} />
              <FileUploader label="Vocal Track" onFile={loadVocal}
                loaded={!!vocalTrack} fileName={vocalTrack?.name} />
              <button
                onClick={runAnalysis}
                disabled={!beatTrack || state === 'analyzing'}
                className="w-full py-2 rounded-xl text-xs font-semibold tracking-wide
                  transition-all duration-150"
                style={beatTrack && state !== 'analyzing'
                  ? { background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                      boxShadow: '0 2px 12px rgba(99,102,241,0.4)' }
                  : { background: 'var(--s2)', color: 'var(--text-3)',
                      border: '1px solid var(--b1)', cursor: 'not-allowed' }}
              >
                {state === 'analyzing' ? 'Analyzing…' : 'Run Analysis'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--b1)' }} />

            {/* Transport */}
            <div className="p-4 flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-3)' }}>Transport</div>

              <div className="flex gap-2">
                <button onClick={handleRewind}
                  className="flex-1 py-2 rounded-xl text-base transition-all duration-100"
                  style={{ background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--text-2)' }}>
                  ⏮
                </button>
                <button onClick={playing ? handleStop : handlePlay}
                  disabled={!beatTrack && !vocalTrack}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-100"
                  style={(!beatTrack && !vocalTrack)
                    ? { background: 'var(--s2)', border: '1px solid var(--b1)',
                        color: 'var(--text-3)', cursor: 'not-allowed' }
                    : playing
                      ? { background: '#ef444422', border: '1px solid #ef444455',
                          color: '#ef4444' }
                      : { background: '#10b98122', border: '1px solid #10b98155',
                          color: '#10b981' }
                  }>
                  {playing ? '■' : '▶'}
                </button>
              </div>

              <div className="text-center text-sm tabular-nums"
                style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--text-2)' }}>
                {formatTime(displayTime)}
                <span style={{ color: 'var(--text-3)' }}> / {formatTime(duration)}</span>
              </div>
            </div>

            {/* BPM display */}
            {analysis && (
              <>
                <div style={{ borderTop: '1px solid var(--b1)' }} />
                <div className="p-4">
                  <BpmDisplay bpm={analysis.bpm} beatInterval={analysis.beatInterval}
                    playing={playing} playTime={displayTime} />
                </div>
              </>
            )}

            <div className="flex-1" />

            {/* Legend */}
            <div style={{ borderTop: '1px solid var(--b1)' }}>
              <div className="p-4 flex flex-col gap-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-3)' }}>Pocket Key</div>
                {[
                  { color: '#10b981', label: 'In Pocket',  sub: '±30 ms' },
                  { color: '#ef4444', label: 'Rushed',     sub: '−31 to −80 ms' },
                  { color: '#f59e0b', label: 'Dragged',    sub: '+31 to +80 ms' },
                  { color: '#475569', label: 'Off Beat',   sub: '> ±80 ms' },
                ].map(({ color, label, sub }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }} />
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text)' }}>{label}</div>
                      <div className="text-[10px]" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--text-3)' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────── */}
          <main ref={mainRef} className="flex flex-col flex-1 min-w-0 overflow-y-auto overflow-x-hidden">

            {/* Waveform region */}
            <div style={{ background: 'var(--bg)' }}>

              {/* Time ruler — synced */}
              <TimeRuler
                duration={duration}
                pixelsPerSecond={PPS}
                scrollLeft={scrollPx}
                beats={analysis?.beats}
              />

              {/* Beat track */}
              <div style={{ borderTop: '1px solid var(--b1)' }}>
                <TrackLabel name={beatTrack?.name ?? 'Beat'} color="#3b82f6"
                  duration={beatTrack?.duration} />
                <WaveformCanvas
                  waveMin={beatPeaks?.min ?? null} waveMax={beatPeaks?.max ?? null}
                  duration={beatTrack?.duration ?? 30}
                  sampleRate={beatTrack?.buffer.sampleRate ?? 44100}
                  pixelsPerSecond={PPS} beats={analysis?.beats}
                  pocketWindowMs={analysis?.pocketWindow}
                  playheadSec={displayTime}
                  color="#3b82f6" height={144}
                  scrollLeft={scrollPx} onScroll={handleScroll}
                />
              </div>

              {/* Vocal track */}
              <div style={{ borderTop: '1px solid var(--b1)' }}>
                <TrackLabel name={vocalTrack?.name ?? 'Vocal'} color="#a855f7"
                  duration={vocalTrack?.duration} />
                <WaveformCanvas
                  waveMin={vocalPeaks?.min ?? null} waveMax={vocalPeaks?.max ?? null}
                  duration={vocalTrack?.duration ?? beatTrack?.duration ?? 30}
                  sampleRate={vocalTrack?.buffer.sampleRate ?? 44100}
                  pixelsPerSecond={PPS} beats={analysis?.beats}
                  vocalHits={analysis?.vocalHits}
                  pocketWindowMs={analysis?.pocketWindow}
                  playheadSec={displayTime}
                  color="#a855f7" height={144}
                  scrollLeft={scrollPx} onScroll={handleScroll}
                />
              </div>
            </div>

            {/* Analysis panels */}
            <div className="flex flex-col gap-5 p-5" style={{ borderTop: '1px solid var(--b1)' }}>
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1 min-w-0"><MetricsPanel result={analysis} /></div>
                <div className="flex-1 min-w-0"><HitGrid hits={analysis?.vocalHits ?? []} /></div>
              </div>
              <LyricCoach result={analysis} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

/* ── Helper sub-components ──────────────────────────────── */

function TrackLabel({ name, color, duration }: { name: string; color: string; duration?: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5"
      style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)' }}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium truncate max-w-[200px]"
          style={{ color: 'var(--text-2)' }}>
          {name.replace(/\.[^/.]+$/, '')}
        </span>
      </div>
      {duration !== undefined && (
        <span className="text-[11px] tabular-nums"
          style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--text-3)' }}>
          {duration.toFixed(1)}s
        </span>
      )}
    </div>
  );
}

function BpmDisplay({ bpm, beatInterval, playing, playTime }: {
  bpm: number; beatInterval: number; playing: boolean; playTime: number;
}) {
  const phase = (playTime % beatInterval) / beatInterval;
  const beat  = playing && phase < 0.12;
  return (
    <div className="flex flex-col gap-2.5 rounded-xl p-3"
      style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums transition-colors duration-75"
          style={{ fontFamily: 'var(--font-geist-mono)', color: beat ? '#10b981' : 'var(--accent-2)' }}>
          {bpm.toFixed(1)}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>BPM</span>
      </div>
      {/* 16-step dot grid */}
      <div className="flex gap-0.5">
        {Array.from({ length: 16 }, (_, i) => {
          const active = playing && Math.abs(phase - i / 16) < 0.025;
          const down   = i % 4 === 0;
          return (
            <div key={i} className="rounded-full transition-all duration-75" style={{
              width: down ? 7 : 5, height: down ? 7 : 5,
              backgroundColor: active ? '#10b981'
                : down ? 'var(--accent)'
                : 'var(--b2)',
              opacity: down ? 1 : 0.6,
            }} />
          );
        })}
      </div>
      <div className="text-[10px] tabular-nums" style={{ fontFamily: 'var(--font-geist-mono)', color: 'var(--text-3)' }}>
        {(beatInterval * 1000).toFixed(0)} ms / beat
      </div>
    </div>
  );
}

function formatTime(sec: number): string {
  const m  = Math.floor(sec / 60);
  const s  = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${ms}`;
}
