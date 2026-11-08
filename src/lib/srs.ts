/**
 * Compact FSRS-4.5 style scheduler.
 * Grades: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
 */
import type { Card, CardKind } from '../types';

export type Grade = 1 | 2 | 3 | 4;

const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813,
  0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567,
];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const RETENTION = 0.9;
const MIN = 60_000;
const DAY = 86_400_000;
const MAX_INTERVAL_DAYS = 365;

const clampD = (d: number) => Math.min(10, Math.max(1, d));
const initStability = (g: Grade) => W[g - 1];
const initDifficulty = (g: Grade) => clampD(W[4] - (g - 3) * W[5]);

export function retrievability(elapsedDays: number, stability: number) {
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

function intervalDays(stability: number) {
  const days = (stability / FACTOR) * (Math.pow(RETENTION, 1 / DECAY) - 1);
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(days)));
}

function nextDifficulty(d: number, g: Grade) {
  const raw = d - W[6] * (g - 3);
  return clampD(W[7] * initDifficulty(4) + (1 - W[7]) * raw);
}

function recallStability(d: number, s: number, r: number, g: Grade) {
  const hard = g === 2 ? W[15] : 1;
  const easy = g === 4 ? W[16] : 1;
  return s * (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1);
}

function forgetStability(d: number, s: number, r: number) {
  return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
}

export function newCard(phraseKey: string, kind: CardKind, now = Date.now()): Card {
  return {
    id: `${phraseKey}|${kind}`,
    phraseKey,
    kind,
    state: 'new',
    stability: 0,
    difficulty: 0,
    due: now,
    last: null,
    reps: 0,
    lapses: 0,
    added: now,
  };
}

export function schedule(card: Card, g: Grade, now = Date.now()): Card {
  const c = { ...card, reps: card.reps + 1, last: now };

  if (card.state === 'new') {
    c.stability = initStability(g);
    c.difficulty = initDifficulty(g);
    if (g === 1) return { ...c, state: 'learning', due: now + 1 * MIN };
    if (g === 2) return { ...c, state: 'learning', due: now + 6 * MIN };
    if (g === 3) return { ...c, state: 'learning', due: now + 10 * MIN };
    // Easy on first sight: don't trust it too much
    c.stability = Math.min(c.stability, 4);
    return { ...c, state: 'review', due: now + intervalDays(c.stability) * DAY };
  }

  if (card.state === 'learning') {
    c.difficulty = nextDifficulty(card.difficulty, g);
    if (g === 1) return { ...c, due: now + 1 * MIN };
    if (g === 2) return { ...c, due: now + 6 * MIN };
    // graduate
    c.stability = Math.max(card.stability, g === 4 ? initStability(4) : initStability(3));
    return { ...c, state: 'review', due: now + intervalDays(c.stability) * DAY };
  }

  // review
  const elapsed = card.last ? Math.max(0, (now - card.last) / DAY) : 0;
  const r = retrievability(elapsed, card.stability);
  c.difficulty = nextDifficulty(card.difficulty, g);
  if (g === 1) {
    c.stability = forgetStability(card.difficulty, card.stability, r);
    return { ...c, lapses: card.lapses + 1, state: 'learning', due: now + 5 * MIN };
  }
  c.stability = recallStability(card.difficulty, card.stability, r, g);
  return { ...c, due: now + intervalDays(c.stability) * DAY };
}

/** Human-friendly preview of the next interval for a grade */
export function previewInterval(card: Card, g: Grade, now = Date.now()): string {
  const next = schedule(card, g, now);
  const ms = next.due - now;
  if (ms < 60 * MIN) return `${Math.max(1, Math.round(ms / MIN))}m`;
  if (ms < DAY) return `${Math.round(ms / (60 * MIN))}h`;
  const d = Math.round(ms / DAY);
  if (d < 31) return `${d}d`;
  return `${Math.round(d / 30)}mo`;
}
