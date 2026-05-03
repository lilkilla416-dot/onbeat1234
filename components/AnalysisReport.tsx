'use client';

import type { AnalysisResult } from '../lib/types';
import { generateTips } from './LyricCoach';
import FlowMap from './FlowMap';

interface Props {
  result: AnalysisResult | null;
  beatName?: string;
  vocalName?: string;
}

const STATUS_SYMBOLS: Record<string, string> = {
  'in-pocket': '[IN ]',
  rushed:      '[RUS]',
  dragged:     '[DRG]',
  off:         '[OFF]',
};

export default function AnalysisReport({ result, beatName, vocalName }: Props) {
  if (!result) return null;

  const inPocket = result.vocalHits.filter(h => h.status === 'in-pocket').length;
  const rushed   = result.vocalHits.filter(h => h.status === 'rushed').length;
  const dragged  = result.vocalHits.filter(h => h.status === 'dragged').length;
  const off      = result.vocalHits.filter(h => h.status === 'off').length;
  const total    = result.vocalHits.length;
  const tips     = generateTips(result);
  const now      = new Date().toLocaleString();

  return (
    // Hidden on screen, visible only during print
    <div id="pdf-report" className="hidden print:block print:p-8 print:text-black print:bg-white
      font-mono text-sm leading-relaxed">

      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="text-2xl font-bold tracking-widest">ON BEAT // RHYTHM ANALYZER</div>
        <div className="text-xs tracking-widest mt-1 text-gray-600">
          DSP-POWERED POCKET DETECTION ENGINE — ANALYSIS REPORT
        </div>
        <div className="text-xs text-gray-500 mt-1">Generated: {now}</div>
      </div>

      {/* Track info */}
      <section className="mb-6">
        <div className="font-bold text-base uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
          Tracks
        </div>
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="pr-4 text-gray-500 w-32">Beat Track</td>
              <td className="font-medium">{beatName ?? '(not loaded)'}</td>
            </tr>
            <tr>
              <td className="pr-4 text-gray-500">Vocal Track</td>
              <td className="font-medium">{vocalName ?? '(not loaded)'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Key metrics */}
      <section className="mb-6">
        <div className="font-bold text-base uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
          Key Metrics
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            { label: 'BPM',         value: result.bpm.toFixed(1) },
            { label: 'Pocket Accuracy', value: `${result.accuracy}%` },
            { label: 'Total Hits',  value: String(total) },
            { label: 'Avg Offset',  value: `${result.avgOffsetMs >= 0 ? '+' : ''}${result.avgOffsetMs.toFixed(1)} ms` },
          ].map(({ label, value }) => (
            <div key={label} className="border border-gray-300 rounded p-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
              <div className="text-xl font-bold mt-1">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Hit breakdown table */}
      <section className="mb-6">
        <div className="font-bold text-base uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
          Pocket Breakdown
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="text-left py-1 pr-4">Status</th>
              <th className="text-right py-1 pr-4">Count</th>
              <th className="text-right py-1 pr-4">Pct</th>
              <th className="text-left py-1">Window</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'In Pocket', count: inPocket, window: `±${result.pocketWindow} ms` },
              { label: 'Rushed',    count: rushed,   window: `–${result.pocketWindow + 1} to –80 ms` },
              { label: 'Dragged',   count: dragged,  window: `+${result.pocketWindow + 1} to +80 ms` },
              { label: 'Off Beat',  count: off,      window: '> ±80 ms' },
            ].map(({ label, count, window: w }) => (
              <tr key={label} className="border-b border-gray-100">
                <td className="py-1.5 pr-4 font-medium">{label}</td>
                <td className="text-right py-1.5 pr-4">{count}</td>
                <td className="text-right py-1.5 pr-4">
                  {total > 0 ? `${Math.round((count / total) * 100)}%` : '—'}
                </td>
                <td className="py-1.5 text-gray-500">{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Per-hit log */}
      {result.vocalHits.length > 0 && (
        <section className="mb-6">
          <div className="font-bold text-base uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
            Syllable Hit Log
          </div>
          <div className="text-[10px] text-gray-500 mb-2">
            Format: #N  t=TIME  Δ=OFFSET  STATUS
          </div>
          {/* Chunk into columns of 40 hits */}
          <div className="grid grid-cols-2 gap-x-6">
            {result.vocalHits.map((h, i) => (
              <div key={i} className="text-[9px] font-mono leading-tight py-0.5 flex gap-2">
                <span className="text-gray-400 w-6 text-right">{i + 1}.</span>
                <span className="text-gray-500 w-14">t={h.time.toFixed(2)}s</span>
                <span className="w-16">
                  Δ={h.offsetMs >= 0 ? '+' : ''}{h.offsetMs.toFixed(1)}ms
                </span>
                <span className="font-bold">
                  {STATUS_SYMBOLS[h.status] ?? h.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABAB Flow Map */}
      {result.beats.length >= 8 && (
        <section className="mb-6">
          <div className="font-bold text-base uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            ABAB Flow Map — First 8 Bars
          </div>
          <FlowMap result={result} printMode />
        </section>
      )}

      {/* Lyric coaching tips */}
      <section className="mb-6">
        <div className="font-bold text-base uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
          Lyric Coach — Flow Improvement
        </div>
        {tips.map((tip, idx) => (
          <div key={idx} className="mb-4 pl-3 border-l-2 border-gray-400">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">
              {tip.category} / {tip.severity}
            </div>
            <div className="font-bold mb-1">{tip.title}</div>
            <div className="text-xs text-gray-700 leading-relaxed mb-1">{tip.body}</div>
            {tip.before && (
              <div className="text-[10px] mt-1">
                <div><span className="text-gray-500">BEFORE: </span>{tip.before}</div>
                <div><span className="text-gray-500">AFTER:  </span>{tip.after}</div>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-3 text-[10px] text-gray-400 text-center">
        ON BEAT // RHYTHM ANALYZER — DSP Pocket Detection Engine — {now}
      </div>
    </div>
  );
}
