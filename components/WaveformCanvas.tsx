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
  color?: string;
  height?: number;
  scrollLeft?: number;
  onScroll?: (px: number) => void;
}

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const HIT_COLOR: Record<string, string> = {
  'in-pocket': '#10b981',
  rushed:      '#ef4444',
  dragged:     '#f59e0b',
  off:         '#475569',
};

export default function WaveformCanvas({
  waveMin, waveMax, duration, pixelsPerSecond,
  beats = [], vocalHits = [], pocketWindowMs = 30,
  playheadSec = 0, color = '#3b82f6',
  height = 144, scrollLeft: ctrl, onScroll,
}: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number | null>(null);
  const totalWidth   = Math.max(1, Math.ceil(duration * pixelsPerSecond));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || ctrl === undefined || Math.round(el.scrollLeft) === Math.round(ctrl)) return;
    el.scrollLeft = ctrl;
  }, [ctrl]);

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

    const W   = canvas.width;
    const H   = canvas.height;
    const sl  = container.scrollLeft;
    const mid = H / 2;

    ctx.clearRect(0, 0, W, H);

    /* ── Sunken track background ───────────── */
    ctx.fillStyle = '#080912';
    ctx.fillRect(0, 0, W, H);

    /* ── Pocket shading ────────────────────── */
    const pHalf = (pocketWindowMs / 1000) * pixelsPerSecond;
    ctx.fillStyle = rgba('#10b981', 0.03);
    for (const beat of beats) {
      const bx = beat.time * pixelsPerSecond - sl;
      if (bx < -pHalf || bx > W + pHalf) continue;
      ctx.fillRect(bx - pHalf, 0, pHalf * 2, H);
    }

    /* ── Beat markers ──────────────────────── */
    for (const beat of beats) {
      const bx = beat.time * pixelsPerSecond - sl;
      if (bx < -1 || bx > W + 1) continue;
      const alpha = 0.08 + 0.07 * beat.confidence;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(Math.round(bx), 0, 1, H);
    }

    /* ── Waveform ──────────────────────────── */
    if (waveMin && waveMax) {
      // Create dramatic vertical gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0,    rgba(color, 0.0));
      grad.addColorStop(0.15, rgba(color, 0.2));
      grad.addColorStop(0.42, rgba(color, 0.55));
      grad.addColorStop(0.5,  rgba(color, 0.65));
      grad.addColorStop(0.58, rgba(color, 0.55));
      grad.addColorStop(0.85, rgba(color, 0.2));
      grad.addColorStop(1,    rgba(color, 0.0));

      // Build a single closed path for the waveform shape
      ctx.beginPath();
      let started = false;

      // Forward pass: top edge (positive peaks)
      for (let px = 0; px < W; px++) {
        const dp = px + Math.floor(sl);
        if (dp < 0 || dp >= waveMax.length) {
          if (started) ctx.lineTo(px, mid);
          continue;
        }
        const y = mid - Math.abs(waveMax[dp]) * mid * 0.92;
        if (!started) { ctx.moveTo(px, mid); ctx.lineTo(px, y); started = true; }
        else ctx.lineTo(px, y);
      }
      if (started) ctx.lineTo(W, mid);

      // Backward pass: bottom edge (mirrored troughs)
      for (let px = W - 1; px >= 0; px--) {
        const dp = px + Math.floor(sl);
        const y = (dp >= 0 && dp < waveMin.length)
          ? mid + Math.abs(waveMin[dp]) * mid * 0.92
          : mid;
        ctx.lineTo(px, y);
      }
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Bright edge line — top
      ctx.beginPath();
      started = false;
      ctx.strokeStyle = rgba(color, 0.88);
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      for (let px = 0; px < W; px++) {
        const dp = px + Math.floor(sl);
        if (dp < 0 || dp >= waveMax.length) { started = false; continue; }
        const y = mid - Math.abs(waveMax[dp]) * mid * 0.92;
        if (!started) { ctx.moveTo(px, y); started = true; }
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      // Mirror bottom edge line
      ctx.beginPath();
      started = false;
      for (let px = 0; px < W; px++) {
        const dp = px + Math.floor(sl);
        if (dp < 0 || dp >= waveMin.length) { started = false; continue; }
        const y = mid + Math.abs(waveMin[dp]) * mid * 0.92;
        if (!started) { ctx.moveTo(px, y); started = true; }
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

    } else {
      // Empty state — dashed center line with subtle label
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.font = '13px var(--font-geist-sans, system-ui)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Drop an audio file to load', W / 2, mid);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    /* ── Vocal hit markers ─────────────────── */
    for (const hit of vocalHits) {
      const hx = hit.time * pixelsPerSecond - sl;
      if (hx < -4 || hx > W + 4) continue;
      const col   = HIT_COLOR[hit.status] ?? '#888';
      const isGood = hit.status === 'in-pocket';

      // Full-height line, soft
      ctx.strokeStyle = rgba(col, isGood ? 0.6 : 0.35);
      ctx.lineWidth = isGood ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, H); ctx.stroke();

      // Bright top indicator
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(hx, 5, isGood ? 3 : 2, 0, Math.PI * 2); ctx.fill();

      // Centre dot
      ctx.fillStyle = rgba(col, isGood ? 0.8 : 0.5);
      ctx.beginPath(); ctx.arc(hx, mid, isGood ? 4 : 3, 0, Math.PI * 2); ctx.fill();
    }

    /* ── Playhead ──────────────────────────── */
    const phx = Math.round(playheadSec * pixelsPerSecond - sl);
    if (phx >= 0 && phx <= W) {
      // Wide soft glow
      const grd = ctx.createLinearGradient(phx - 12, 0, phx + 12, 0);
      grd.addColorStop(0,   'rgba(255,255,255,0)');
      grd.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      grd.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(phx - 12, 0, 24, H);

      // Crisp line
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(phx, 0); ctx.lineTo(phx, H); ctx.stroke();

      // Head cap
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(phx, 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ── Top + bottom inner shadow ─────────── */
    const shadowGrad = ctx.createLinearGradient(0, 0, 0, H);
    shadowGrad.addColorStop(0,    'rgba(0,0,0,0.35)');
    shadowGrad.addColorStop(0.08, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(0.92, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(1,    'rgba(0,0,0,0.35)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, W, H);

  }, [waveMin, waveMax, beats, vocalHits, pocketWindowMs, pixelsPerSecond, playheadSec, color]);

  useEffect(() => {
    function loop() { draw(); rafRef.current = requestAnimationFrame(loop); }
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="w-full h-full overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'none' }}>
        <canvas ref={canvasRef} width={totalWidth} height={height} className="block" />
      </div>
    </div>
  );
}
