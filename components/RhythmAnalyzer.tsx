'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import FileUploader from './FileUploader';
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
        const playPx = t * PPS;
        const viewW  = mainRef.current?.clientWidth ?? 800;
        setScrollPx(prev => {
          const out = playPx < prev + 20 || playPx > prev + viewW - 60;
          return out ? Math.max(0, playPx - viewW * 0.3) : prev;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const loadBeat = useCallback(async (file: File) => {
    try {
      setState('analyzing'); setErrorMsg('');
      const buffer = await decodeAudioFile(file);
      setBeatPeaks(computeWaveformPeaks(buffer, PPS));
      setBeatTrack({ buffer, name: file.name, duration: buffer.duration });
      setState('idle');
    } catch (e) { setErrorMsg(`Decode failed: ${e}`); setState('error'); }
  }, []);

  const loadVocal = useCallback(async (file: File) => {
    try {
      setState('analyzing'); setErrorMsg('');
      const buffer = await decodeAudioFile(file);
      setVocalPeaks(computeWaveformPeaks(buffer, PPS));
      setVocalTrack({ buffer, name: file.name, duration: buffer.duration });
      setState('idle');
    } catch (e) { setErrorMsg(`Decode failed: ${e}`); setState('error'); }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!beatTrack) return;
    setState('analyzing'); setErrorMsg('');
    try {
      const beatResult = await detectBeats(beatTrack.buffer);
      let result: AnalysisResult;
      if (vocalTrack) {
        const t = await detectTransients(vocalTrack.buffer);
        result = buildAnalysisResult(beatResult, analyzeVocals(t, beatResult));
      } else {
        result = buildAnalysisResult(beatResult, []);
      }
      setAnalysis(result);
      setState('done');
    } catch (e) { setErrorMsg(`Analysis failed: ${e}`); setState('error'); }
  }, [beatTrack, vocalTrack]);

  const handlePlay = useCallback(() => {
    if (!beatTrack && !vocalTrack) return;
    playTracks(
      beatTrack?.buffer ?? null,
      vocalTrack?.buffer ?? null,
      seekSec,
      () => { setPlaying(false); playingRef.current = false; },
    );
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

      <div id="app-ui" className="flex flex-col h-full bg-[#08090d] text-[#dde1f0]"
        style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>

        {/* ── Header ───────────────────────────────────────── */}
        <header className="flex items-center justify-between px-5 h-12 shrink-0
          border-b border-white/[0.06] bg-[#08090d]/95 backdrop-blur-sm z-20">

          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="flex items-center gap-1.5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="rgba(129,140,248,0.6)" strokeWidth="1.5"/>
                <circle cx="10" cy="10" r="3" fill="rgba(129,140,248,0.8)"/>
                <line x1="10" y1="1" x2="10" y2="4" stroke="rgba(129,140,248,0.5)" strokeWidth="1.5"/>
                <line x1="10" y1="16" x2="10" y2="19" stroke="rgba(129,140,248,0.5)" strokeWidth="1.5"/>
                <line x1="1" y1="10" x2="4" y2="10" stroke="rgba(129,140,248,0.5)" strokeWidth="1.5"/>
                <line x1="16" y1="10" x2="19" y2="10" stroke="rgba(129,140,248,0.5)" strokeWidth="1.5"/>
              </svg>
              <span className="text-sm font-semibold tracking-tight text-white/90">On Beat</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-xs text-white/30 tracking-wide">Rhythm Analyzer</span>
          </div>

          <div className="flex items-center gap-3">
            {state === 'analyzing' && (
              <span className="text-xs text-indigo-400 animate-soft-pulse">Analyzing…</span>
            )}
            {state === 'done' && (
              <span className="text-xs text-emerald-400">Analysis ready</span>
            )}
            {state === 'error' && (
              <span className="text-xs text-red-400">{errorMsg}</span>
            )}

            {analysis && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                  bg-white/[0.04] border border-white/[0.08] text-white/50
                  hover:bg-white/[0.07] hover:text-white/75 hover:border-white/[0.14]
                  transition-all duration-150"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v7M3 5l3 3 3-3M1 9v1.5A.5.5 0 001.5 11h9a.5.5 0 00.5-.5V9"
                    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export PDF
              </button>
            )}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">

          {/* ── Sidebar ────────────────────────────────────── */}
          <aside className="flex flex-col w-56 shrink-0 border-r border-white/[0.06]
            bg-[#0a0b10] overflow-y-auto">

            <div className="flex flex-col gap-3 p-4">
              <p className="text-[11px] text-white/25 uppercase tracking-widest font-medium">Tracks</p>

              <FileUploader label="Beat" onFile={loadBeat} loaded={!!beatTrack} fileName={beatTrack?.name} />
              <FileUploader label="Vocal" onFile={loadVocal} loaded={!!vocalTrack} fileName={vocalTrack?.name} />

              <button
                onClick={runAnalysis}
                disabled={!beatTrack || state === 'analyzing'}
                className={`
                  w-full py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-150
                  ${beatTrack && state !== 'analyzing'
                    ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 hover:border-indigo-400/50 cursor-pointer'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/20 cursor-not-allowed'}
                `}
              >
                {state === 'analyzing' ? 'Analyzing…' : 'Run Analysis'}
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.05] mx-4" />

            {/* Playback */}
            <div className="flex flex-col gap-3 p-4">
              <p className="text-[11px] text-white/25 uppercase tracking-widest font-medium">Playback</p>

              <div className="flex gap-2">
                <button
                  onClick={handleRewind}
                  className="flex-1 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/[0.07]
                    text-white/50 hover:text-white/80 hover:bg-white/[0.07] transition-all"
                >⏮</button>
                <button
                  onClick={playing ? handleStop : handlePlay}
                  disabled={!beatTrack && !vocalTrack}
                  className={`
                    flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${(!beatTrack && !vocalTrack)
                      ? 'bg-white/[0.03] border border-white/[0.06] text-white/20 cursor-not-allowed'
                      : playing
                        ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                        : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'}
                  `}
                >
                  {playing ? '⏹' : '▶'}
                </button>
              </div>

              <div className="text-center text-xs tabular-nums"
                style={{ fontFamily: 'var(--font-geist-mono)' }}>
                <span className="text-white/60">{formatTime(displayTime)}</span>
                <span className="text-white/20"> / {formatTime(duration)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.05] mx-4" />

            {/* Legend */}
            <div className="flex flex-col gap-2.5 p-4">
              <p className="text-[11px] text-white/25 uppercase tracking-widest font-medium">Pocket Key</p>
              {[
                { color: '#34d399', label: 'In Pocket',  sub: '±30 ms' },
                { color: '#f87171', label: 'Rushed',     sub: '–31 to –80 ms' },
                { color: '#fbbf24', label: 'Dragged',    sub: '+31 to +80 ms' },
                { color: '#4b5563', label: 'Off Beat',   sub: '> ±80 ms' },
              ].map(({ color, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }} />
                  <div>
                    <div className="text-xs text-white/65">{label}</div>
                    <div className="text-[10px] text-white/25"
                      style={{ fontFamily: 'var(--font-geist-mono)' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Analysis BPM badge */}
            {analysis && (
              <>
                <div className="h-px bg-white/[0.05] mx-4" />
                <div className="p-4">
                  <BpmBadge bpm={analysis.bpm} beatInterval={analysis.beatInterval}
                    playing={playing} playTime={displayTime} />
                </div>
              </>
            )}
          </aside>

          {/* ── Main ───────────────────────────────────────── */}
          <main ref={mainRef} className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

            {/* Beat waveform */}
            <TrackRow label="Beat" duration={beatTrack?.duration}>
              <WaveformCanvas
                waveMin={beatPeaks?.min ?? null} waveMax={beatPeaks?.max ?? null}
                duration={beatTrack?.duration ?? 30}
                sampleRate={beatTrack?.buffer.sampleRate ?? 44100}
                pixelsPerSecond={PPS} beats={analysis?.beats}
                pocketWindowMs={analysis?.pocketWindow}
                playheadSec={displayTime} label="" color="#60a5fa"
                height={104} scrollLeft={scrollPx} onScroll={handleScroll}
              />
            </TrackRow>

            <TrackRow label="Vocal" duration={vocalTrack?.duration}>
              <WaveformCanvas
                waveMin={vocalPeaks?.min ?? null} waveMax={vocalPeaks?.max ?? null}
                duration={vocalTrack?.duration ?? beatTrack?.duration ?? 30}
                sampleRate={vocalTrack?.buffer.sampleRate ?? 44100}
                pixelsPerSecond={PPS} beats={analysis?.beats}
                vocalHits={analysis?.vocalHits} pocketWindowMs={analysis?.pocketWindow}
                playheadSec={displayTime} label="" color="#c084fc"
                height={104} scrollLeft={scrollPx} onScroll={handleScroll}
              />
            </TrackRow>

            {/* Metrics */}
            <div className="flex flex-col lg:flex-row gap-4 p-4">
              <div className="flex-1 min-w-0"><MetricsPanel result={analysis} /></div>
              <div className="flex-1 min-w-0"><HitGrid hits={analysis?.vocalHits ?? []} /></div>
            </div>

            {/* Lyric coach */}
            <div className="px-4 pb-6">
              <LyricCoach result={analysis} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function TrackRow({ label, duration, children }: {
  label: string; duration?: number; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/[0.05]">
      <div className="flex items-center justify-between px-4 py-1.5 bg-white/[0.015]">
        <span className="text-[11px] text-white/30 font-medium tracking-wide">{label}</span>
        {duration !== undefined && (
          <span className="text-[11px] text-white/20 tabular-nums"
            style={{ fontFamily: 'var(--font-geist-mono)' }}>
            {duration.toFixed(1)}s
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function BpmBadge({ bpm, beatInterval, playing, playTime }: {
  bpm: number; beatInterval: number; playing: boolean; playTime: number;
}) {
  const phase = (playTime % beatInterval) / beatInterval;
  const flash = playing && phase < 0.12;
  return (
    <div className="flex flex-col gap-2 rounded-lg p-3 bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-2xl font-semibold tabular-nums transition-colors duration-75"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            color: flash ? '#34d399' : '#818cf8',
          }}
        >{bpm.toFixed(1)}</span>
        <span className="text-xs text-white/30">BPM</span>
      </div>
      <div className="flex gap-0.5 items-center">
        {Array.from({ length: 16 }, (_, i) => {
          const dp = i / 16;
          const active = playing && Math.abs(phase - dp) < 0.025;
          const isDB   = i % 4 === 0;
          return (
            <div key={i} className="rounded-full transition-all duration-75"
              style={{
                width: isDB ? 6 : 4, height: isDB ? 6 : 4,
                backgroundColor: active ? '#34d399' : isDB ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.08)',
              }}
            />
          );
        })}
      </div>
      <div className="text-[10px] text-white/25 tabular-nums"
        style={{ fontFamily: 'var(--font-geist-mono)' }}>
        {(beatInterval * 1000).toFixed(0)} ms/beat
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
