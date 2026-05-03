'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Beat, VocalHit } from '../lib/types';

interface Props {
  waveMin: Float32Array | null;
  waveMax: Float32Array | null;
  duration: number;
  sampleRate: number;
  pixelsPerSecond: number;
  beats?: Beat[];
  vocalHits?: VocalHit[];
  pocketWindowMs?: number;
  playheadSec?: number;
  label: string;
  color?: string;
  height?: number;
  // Controlled scroll — parent owns the scroll position for sync
  scrollLeft?: number;
  onScroll?: (px: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  'in-pocket': '#00ff88',
  rushed:      '#ff3344',
  dragged:     '#ffcc00',
  off:         '#555566',
};

const NEON_GLOW: Record<string, string> = {
  'in-pocket': 'rgba(0,255,136,0.7)',
  rushed:      'rgba(255,51,68,0.7)',
  dragged:     'rgba(255,204,0,0.7)',
  off:         'rgba(80,80,100,0.3)',
};

export default function WaveformCanvas({
  waveMin,
  waveMax,
  duration,
  pixelsPerSecond,
  beats = [],
  vocalHits = [],
  pocketWindowMs = 30,
  playheadSec = 0,
  label,
  color = '#00ccff',
  height = 120,
  scrollLeft: controlledScroll,
  onScroll,
}: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number | null>(null);

  const totalWidth = Math.max(1, Math.ceil(duration * pixelsPerSecond));

  // Apply controlled scroll position from parent (enables sync between canvases)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || controlledScroll === undefined) return;
    if (Math.round(el.scrollLeft) !== Math.round(controlledScroll)) {
      el.scrollLeft = controlledScroll;
    }
  }, [controlledScroll]);

  // Bubble user-initiated scroll events to parent for syncing the other canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onScroll) return;
    const handler = () => onScroll(el.scrollLeft);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [onScroll]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const sl = container.scrollLeft;

    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(0,200,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,200,255,0.03)';
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Beat pocket windows
    const pocketHalfPx = (pocketWindowMs / 1000) * pixelsPerSecond;
    ctx.fillStyle = 'rgba(0,255,136,0.04)';
    for (const beat of beats) {
      const bx = beat.time * pixelsPerSecond - sl;
      if (bx < -pocketHalfPx * 3 || bx > W + pocketHalfPx * 3) continue;
      ctx.fillRect(bx - pocketHalfPx, 0, pocketHalfPx * 2, H);
    }

    // Beat lines
    for (const beat of beats) {
      const bx = beat.time * pixelsPerSecond - sl;
      if (bx < -2 || bx > W + 2) continue;
      const alpha = 0.3 + 0.5 * beat.confidence;
      ctx.strokeStyle = `rgba(0,220,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = beat.confidence > 0.7 ? 4 : 0;
      ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, H); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Waveform body
    if (waveMin && waveMax) {
      const mid = H / 2;
      ctx.fillStyle = color + '55';
      for (let px = 0; px < W; px++) {
        const dp = px + Math.floor(sl);
        if (dp < 0 || dp >= waveMin.length) continue;
        const lo = waveMin[dp];
        const hi = waveMax[dp];
        const y1 = mid - hi * mid * 0.9;
        const y2 = mid - lo * mid * 0.9;
        ctx.fillRect(px, y1, 1, Math.max(1, y2 - y1));
      }
      // Bright peak line
      ctx.strokeStyle = color + 'cc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let px = 0; px < W; px++) {
        const dp = px + Math.floor(sl);
        if (dp < 0 || dp >= waveMax.length) continue;
        const y = H / 2 - waveMax[dp] * H * 0.45;
        px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(0,200,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    }

    // Vocal hit markers
    for (const hit of vocalHits) {
      const hx = hit.time * pixelsPerSecond - sl;
      if (hx < -4 || hx > W + 4) continue;
      const col  = STATUS_COLORS[hit.status] ?? '#aaa';
      const glow = NEON_GLOW[hit.status] ?? 'transparent';

      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.shadowColor = glow;
      ctx.shadowBlur = hit.status === 'in-pocket' ? 10 : 5;
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, H); ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(hx, 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Playhead
    const px = playheadSec * pixelsPerSecond - sl;
    if (px >= 0 && px <= W) {
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255,0,255,0.8)';
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff00ff';
      ctx.beginPath();
      ctx.moveTo(px - 6, 0); ctx.lineTo(px + 6, 0); ctx.lineTo(px, 10);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = 'rgba(0,200,255,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText(label.toUpperCase(), 8, 14);
  }, [waveMin, waveMax, beats, vocalHits, pocketWindowMs, pixelsPerSecond, playheadSec, label, color]);

  useEffect(() => {
    function loop() { draw(); rafRef.current = requestAnimationFrame(loop); }
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="w-full overflow-x-auto overflow-y-hidden" style={{ height }}>
        <canvas ref={canvasRef} width={totalWidth} height={height} className="block" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black to-transparent" />
    </div>
  );
}
