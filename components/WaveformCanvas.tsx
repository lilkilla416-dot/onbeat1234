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
  /** Base hex color for the waveform, e.g. "#60a5fa" */
  color?: string;
  height?: number;
  scrollLeft?: number;
  onScroll?: (px: number) => void;
}

/* Hex color → rgba string */
function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const STATUS_COLOR: Record<string, string> = {
  'in-pocket': '#34d399',
  rushed:      '#f87171',
  dragged:     '#fbbf24',
  off:         '#4b5563',
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
  color = '#60a5fa',
  height = 120,
  scrollLeft: controlledScroll,
  onScroll,
}: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number | null>(null);
  const totalWidth   = Math.max(1, Math.ceil(duration * pixelsPerSecond));

  /* Sync controlled scroll from parent */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || controlledScroll === undefined) return;
    if (Math.round(el.scrollLeft) !== Math.round(controlledScroll)) {
      el.scrollLeft = controlledScroll;
    }
  }, [controlledScroll]);

  /* Report user-initiated scroll back to parent */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onScroll) return;
    const h = () => onScroll(el.scrollLeft);
    el.addEventListener('scroll', h, { passive: true });
    return () => el.removeEventListener('scroll', h);
  }, [onScroll]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W  = canvas.width;
    const H  = canvas.height;
    const sl = container.scrollLeft;
    const mid = H / 2;

    ctx.clearRect(0, 0, W, H);

    /* ── Background ───────────────────────────────── */
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    ctx.fillRect(0, 0, W, H);

    /* ── Very subtle horizontal center line ───────── */
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();

    /* ── Pocket shading around each beat ──────────── */
    const pocketHalfPx = (pocketWindowMs / 1000) * pixelsPerSecond;
    ctx.fillStyle = rgba(STATUS_COLOR['in-pocket'], 0.025);
    for (const beat of beats) {
      const bx = beat.time * pixelsPerSecond - sl;
      if (bx < -pocketHalfPx * 2 || bx > W + pocketHalfPx * 2) continue;
      ctx.fillRect(bx - pocketHalfPx, 0, pocketHalfPx * 2, H);
    }

    /* ── Beat marker lines ────────────────────────── */
    for (const beat of beats) {
      const bx = beat.time * pixelsPerSecond - sl;
      if (bx < -1 || bx > W + 1) continue;
      // Downbeat (every 4th) slightly brighter
      const alpha = 0.12 + 0.1 * beat.confidence;
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, H); ctx.stroke();
    }

    /* ── Waveform ─────────────────────────────────── */
    if (waveMin && waveMax) {
      // Vertical gradient — brighter at center, fades to edges
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0,    rgba(color, 0.05));
      grad.addColorStop(0.25, rgba(color, 0.28));
      grad.addColorStop(0.5,  rgba(color, 0.50));
      grad.addColorStop(0.75, rgba(color, 0.28));
      grad.addColorStop(1,    rgba(color, 0.05));
      ctx.fillStyle = grad;

      // Draw one filled column per screen pixel
      for (let px = 0; px < W; px++) {
        const dp = px + Math.floor(sl);
        if (dp < 0 || dp >= waveMin.length) continue;
        const lo = waveMin[dp];
        const hi = waveMax[dp];
        const y1 = mid - Math.abs(hi) * mid * 0.88;
        const y2 = mid + Math.abs(lo) * mid * 0.88;
        ctx.fillRect(px, y1, 1, Math.max(1, y2 - y1));
      }

      // Top edge highlight line
      ctx.strokeStyle = rgba(color, 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      let started = false;
      for (let px = 0; px < W; px++) {
        const dp = px + Math.floor(sl);
        if (dp < 0 || dp >= waveMax.length) continue;
        const y = mid - Math.abs(waveMax[dp]) * mid * 0.88;
        if (!started) { ctx.moveTo(px, y); started = true; }
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      // Mirror bottom edge line
      ctx.beginPath();
      started = false;
      for (let px = 0; px < W; px++) {
        const dp = px + Math.floor(sl);
        if (dp < 0 || dp >= waveMin.length) continue;
        const y = mid + Math.abs(waveMin[dp]) * mid * 0.88;
        if (!started) { ctx.moveTo(px, y); started = true; }
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

    } else {
      // Empty state — dashed center line
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* ── Vocal hit markers ────────────────────────── */
    for (const hit of vocalHits) {
      const hx = hit.time * pixelsPerSecond - sl;
      if (hx < -4 || hx > W + 4) continue;
      const col = STATUS_COLOR[hit.status] ?? '#888';
      const isGood = hit.status === 'in-pocket';

      // Subtle vertical line
      ctx.strokeStyle = rgba(col, isGood ? 0.55 : 0.38);
      ctx.lineWidth = isGood ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(hx, 4); ctx.lineTo(hx, H - 4); ctx.stroke();

      // Dot at midpoint
      ctx.fillStyle = rgba(col, isGood ? 0.9 : 0.65);
      ctx.beginPath();
      ctx.arc(hx, mid, isGood ? 3 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Indicator dot at top
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(hx, 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ── Playhead ─────────────────────────────────── */
    const px = playheadSec * pixelsPerSecond - sl;
    if (px >= 0 && px <= W) {
      // Soft glow
      const grd = ctx.createLinearGradient(px - 8, 0, px + 8, 0);
      grd.addColorStop(0,   'rgba(255,255,255,0)');
      grd.addColorStop(0.5, 'rgba(255,255,255,0.08)');
      grd.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(px - 8, 0, 16, H);

      // Crisp line
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();

      // Top indicator dot
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px, 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ── Track label ──────────────────────────────── */
    ctx.fillStyle = rgba(color, 0.35);
    ctx.font = '500 10px var(--font-geist-sans, system-ui)';
    ctx.fillText(label, 10, H - 8);

  }, [waveMin, waveMax, beats, vocalHits, pocketWindowMs, pixelsPerSecond, playheadSec, label, color]);

  /* RAF loop */
  useEffect(() => {
    function loop() { draw(); rafRef.current = requestAnimationFrame(loop); }
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="w-full h-full overflow-x-auto overflow-y-hidden">
        <canvas ref={canvasRef} width={totalWidth} height={height} className="block" />
      </div>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8
        bg-gradient-to-r from-[#08090d] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8
        bg-gradient-to-l from-[#08090d] to-transparent" />
    </div>
  );
}
