'use client';

import type { AnalysisResult } from '../lib/types';
import FlowMap from './FlowMap';

interface Tip {
  category: 'technique' | 'structure' | 'rewrite';
  severity: 'info' | 'warn' | 'critical';
  title: string;
  body: string;
  before?: string;
  after?: string;
}

const SEVERITY_META: Record<string, { accent: string; badge: string }> = {
  critical: { accent: '#f87171', badge: 'Critical' },
  warn:     { accent: '#fbbf24', badge: 'Warning'  },
  info:     { accent: '#818cf8', badge: 'Tip'      },
};

const CATEGORY_LABEL: Record<string, string> = {
  technique: 'Technique',
  structure: 'Structure',
  rewrite:   'Rewrite',
};

function generateTips(result: AnalysisResult): Tip[] {
  const { avgOffsetMs, accuracy, vocalHits, bpm, beatInterval, pocketWindow } = result;
  const total   = vocalHits.length;
  const rushed  = vocalHits.filter(h => h.status === 'rushed').length;
  const dragged = vocalHits.filter(h => h.status === 'dragged').length;
  const off     = vocalHits.filter(h => h.status === 'off').length;
  const tips: Tip[] = [];

  if (total === 0) {
    tips.push({
      category: 'technique', severity: 'info',
      title: 'No Vocal Hits Detected',
      body: 'Load a vocal track and run analysis to receive coaching suggestions.',
    });
    return tips;
  }

  // ── Overall pocket assessment ─────────────────────────────
  if (accuracy >= 80) {
    tips.push({
      category: 'technique', severity: 'info',
      title: `Tight Pocket — ${accuracy}% In`,
      body: `Only ${total - Math.round(total * accuracy / 100)} hits fall outside the ±${pocketWindow}ms window. Your internal clock is locking the groove. The remaining misses likely cluster at phrase boundaries or breath points — check bars where you need more air.`,
    });
  } else if (accuracy >= 55) {
    tips.push({
      category: 'technique', severity: 'warn',
      title: `Developing Pocket — ${accuracy}% In`,
      body: `You're hitting the pocket more than half the time, but ${total - Math.round(total * accuracy / 100)} syllables drift out. Focus on the first and last syllable of each phrase — they anchor the listener's perception of your timing.`,
    });
  } else {
    tips.push({
      category: 'technique', severity: 'critical',
      title: `Timing Drift — Only ${accuracy}% In Pocket`,
      body: `More than half your syllables land outside the groove window. Before re-recording, practice: (1) click-track drills at ${bpm.toFixed(0)} BPM with just 4 syllables, then expand. (2) Record yourself counting 1-2-3-4 to the beat before adding words.`,
    });
  }

  // ── Rush vs drag tendency ─────────────────────────────────
  const rushRatio  = total > 0 ? rushed  / total : 0;
  const dragRatio  = total > 0 ? dragged / total : 0;

  if (avgOffsetMs < -20 || rushRatio > 0.3) {
    const ms = Math.abs(avgOffsetMs).toFixed(0);
    tips.push({
      category: 'technique', severity: rushRatio > 0.4 ? 'critical' : 'warn',
      title: `Consistent Rush (+${ms} ms early on average)`,
      body: `Your phrases are anticipating the beat. This usually means you're breathing out before the bar starts — you haven't filled your lungs yet, so you start too soon. Try the "late entry" drill: count silently through 1 full bar before you open your mouth. The beat will feel like it's coming to you.`,
      before: '"WORD word word word" — you push the downbeat early',
      after:  '"(1-2-3-4) WORD word word" — the bar of rest pulls your entry back',
    });
    tips.push({
      category: 'rewrite', severity: 'info',
      title: 'Rewrite Fix: Add Pickup Syllables',
      body: 'Adding a throwaway pickup syllable ("uh", "and", "the", "a") before your stressed word creates a natural delay. You deliver the pickup early, which lands the real syllable exactly on the beat.',
      before: '"FIRE on the one" — FIRE lands early',
      after:  '"and FIRE on the one" — "and" is swallowed, FIRE hits the 1',
    });
  }

  if (avgOffsetMs > 20 || dragRatio > 0.3) {
    const ms = avgOffsetMs.toFixed(0);
    tips.push({
      category: 'technique', severity: dragRatio > 0.4 ? 'critical' : 'warn',
      title: `Consistent Drag (+${ms} ms late on average)`,
      body: `You're sitting behind the beat. The most common cause is holding vowels too long — the word starts right but the consonant release that the listener perceives as the "hit" comes late. Focus on snapping consonants, not cradling vowels.`,
      before: '"I knoooow the way" — the "w" of "way" lands late',
      after:  '"I know the WAY" — short vowel, hard consonant attack on "w"',
    });
    tips.push({
      category: 'rewrite', severity: 'info',
      title: 'Rewrite Fix: Front-Load Phrases',
      body: 'Remove filler openers ("and then", "so like", "yeah well") and start with action words. A consonant-heavy first word creates a percussive attack that snaps onto the beat.',
      before: '"And then I go and hit the spot" — buried lead',
      after:  '"HIT the spot" — 3 syllables, hard entry, lands on time',
    });
  }

  // ── Off-beat analysis ─────────────────────────────────────
  if (off > 3 || (total > 0 && off / total > 0.2)) {
    tips.push({
      category: 'structure', severity: 'critical',
      title: `${off} Full Rhythmic Breaks (>80 ms off)`,
      body: `These aren't timing errors — they're structural disconnects. The syllable pattern of your lyric doesn't fit the ${bpm.toFixed(0)} BPM grid at all in those moments. You have two options: (1) Rewrite those bars with fewer syllables so each one has breathing room, or (2) Relearn the bar by speaking the words in rhythm (not melody) to the click track first.`,
    });
  }

  // ── Tempo-specific structural advice ─────────────────────
  if (bpm < 85) {
    tips.push({
      category: 'structure', severity: 'info',
      title: `Slow Tempo Spacing (${bpm.toFixed(0)} BPM = ${(beatInterval * 1000).toFixed(0)} ms/beat)`,
      body: 'At this tempo each beat is wide open — gaps between syllables will feel vast. Use syncopation: place syllables on the upbeats (the "and" between beats) rather than only hitting downbeats. This fills space rhythmically without adding more words.',
      before: 'Hitting only beats 1, 2, 3, 4',
      after:  'Try: beat-1, and-1, beat-2 — the "and" adds life without clutter',
    });
  } else if (bpm > 140) {
    tips.push({
      category: 'structure', severity: 'info',
      title: `Fast Tempo Density (${bpm.toFixed(0)} BPM = ${(beatInterval * 1000).toFixed(0)} ms/beat)`,
      body: `At ${bpm.toFixed(0)} BPM each beat slot is only ${(beatInterval * 1000).toFixed(0)} ms wide — very easy to overstuff. High syllable density multiplies rush risk exponentially. Consider half-time phrasing: write one bar of lyrics that rides over two bars of music. Less is faster.`,
      before: '16 syllables crammed into one bar — guaranteed rush',
      after:  '8 syllables over two bars — the space makes it feel faster, not slower',
    });
  }

  // ── Phrase boundary tip ───────────────────────────────────
  if (rushRatio > 0.15 && dragRatio > 0.15) {
    tips.push({
      category: 'technique', severity: 'info',
      title: 'Mixed Rush/Drag — Phrase Boundary Tension',
      body: `You rush into phrases (${rushed} rushed hits) and drag out of them (${dragged} dragged hits). This is a classic pattern: you're excited entering a line, then run out of tempo energy by the end. Practice the phrase in reverse — nail the last syllable first, then add from the front.`,
    });
  }

  return tips;
}

interface Props {
  result: AnalysisResult | null;
}

const MONO = { fontFamily: 'var(--font-geist-mono)' };

export default function LyricCoach({ result }: Props) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-24 rounded-xl text-sm"
        style={{ background: 'var(--s1)', border: '1px solid var(--b1)', color: 'var(--text-3)' }}>
        Analyze a track to unlock coaching
      </div>
    );
  }

  const tips = generateTips(result);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl"
      style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Lyric Coach</span>
        <span className="text-[11px]" style={{ color: 'var(--text-3)', ...MONO }}>
          {tips.length} suggestions
        </span>
      </div>

      {result.beats.length >= 8 && <FlowMap result={result} />}

      <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto">
        {tips.map((tip, idx) => {
          const meta = SEVERITY_META[tip.severity];
          return (
            <div key={idx}
              className="rounded-xl p-3.5 transition-colors duration-150"
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--b1)',
                borderLeftWidth: 2,
                borderLeftColor: meta.accent,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: meta.accent + '20', color: meta.accent }}>
                  {meta.badge}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: 'var(--text-3)' }}>
                  {CATEGORY_LABEL[tip.category]}
                </span>
              </div>

              <div className="text-sm font-medium mb-1.5 leading-snug" style={{ color: 'var(--text)' }}>
                {tip.title}
              </div>

              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {tip.body}
              </div>

              {tip.before && tip.after && (
                <div className="flex flex-col gap-1 mt-3 rounded-lg overflow-hidden text-[11px]"
                  style={MONO}>
                  <div className="flex gap-2 items-start px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <span className="shrink-0 mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>✕</span>
                    <span className="italic" style={{ color: 'var(--text-2)' }}>{tip.before}</span>
                  </div>
                  <div className="flex gap-2 items-start px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <span className="shrink-0 mt-0.5" style={{ color: 'rgba(52,211,153,0.8)' }}>✓</span>
                    <span className="italic" style={{ color: '#6ee7b7' }}>{tip.after}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { generateTips };
export type { Tip };
