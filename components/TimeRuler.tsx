'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Beat } from '../lib/types';

interface Props {
  duration: number;
  pixelsPerSecond: number;
  scrollLeft?: number;
  beats?: Beat[];
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

const H = 24;

export default function TimeRuler({ duration, pixelsPerSecond, scrollLeft = 0, beats = [] }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number | null>(null);
  const totalWidth   = Math.max(1, Math.ceil(duration * pixelsPerSecond));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || Math.round(el.scrollLeft) === Math.round(scrollLeft)) return;
    el.scrollLeft = scrollLeft;
  }, [scrollLeft]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W  = canvas.width;
    const sl = container.scrollLeft;

    ctx.clearRect(0, 0, W, H);

    // Background — slightly lighter than waveform bg so it reads as a label bar
    ctx.fillStyle = '#0a0c16';
    ctx.fillRect(0, 0, W, H);

    // Bottom separator line
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(0, H - 1, W, 1);

    const vStart = sl / pixelsPerSecond;
    const vEnd   = (sl + W) / pixelsPerSecond;

    // Choose major interval based on zoom / duration
    const totalSec = duration;
    const majorSec = totalSec > 300 ? 60 : totalSec > 120 ? 30 : totalSec > 60 ? 10 : 5;
    const minorSec = majorSec <= 10 ? 1 : majorSec <= 30 ? 5 : 10;

    // Half-second micro ticks
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let t = Math.floor(vStart * 2) / 2; t <= vEnd; t += 0.5) {
      if (t % 1 === 0) continue;
      const px = Math.round(t * pixelsPerSecond - sl);
      if (px >= 0 && px <= W) ctx.fillRect(px, H - 3, 1, 3);
    }

    // Minor ticks (every minorSec)
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (let t = Math.floor(vStart / minorSec) * minorSec; t <= vEnd; t += minorSec) {
      if (t % majorSec === 0) continue;
      const px = Math.round(t * pixelsPerSecond - sl);
      if (px >= 0 && px <= W) ctx.fillRect(px, H - 6, 1, 6);
    }

    // Major ticks + labels
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.font = '500 9px var(--font-geist-mono, monospace)';
    ctx.textBaseline = 'middle';
    for (let t = Math.floor(vStart / majorSec) * majorSec; t <= vEnd; t += majorSec) {
      if (t < 0) continue;
      const px = Math.round(t * pixelsPerSecond - sl);
      if (px < -1 || px > W + 1) continue;
      // Tick
      ctx.fillStyle = 'rgba(255,255,255,0.30)';
      ctx.fillRect(px, 0, 1, H - 1);
      // Label
      if (px + 4 < W) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText(fmt(t), px + 4, H / 2 - 1);
      }
    }

    // Beat markers (indigo ticks at top, very subtle)
    ctx.fillStyle = 'rgba(99,102,241,0.55)';
    for (const beat of beats) {
      const px = Math.round(beat.time * pixelsPerSecond - sl);
      if (px >= 0 && px <= W) ctx.fillRect(px, 0, 1, 5);
    }
  }, [duration, pixelsPerSecond, beats, scrollLeft]);

  useEffect(() => {
    function loop() { draw(); rafRef.current = requestAnimationFrame(loop); }
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden" style={{ height: H }}>
      <canvas ref={canvasRef} width={totalWidth} height={H} className="block" />
    </div>
  );
}
