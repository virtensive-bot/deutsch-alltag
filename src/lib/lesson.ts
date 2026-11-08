import type { Phrase } from '../types';
import { PATH, allPathItems, pathItemKey, type DialogueStep, type PathLesson, type PathUnit } from '../content/path';

export interface Item extends Phrase {
  key: string;
}

/** Exercise types, ordered roughly from easiest to hardest. */
export type Exercise =
  | { t: 'intro'; item: Item }
  | { t: 'meaning'; item: Item; options: string[] } // see+hear German → pick English
  | { t: 'hear'; item: Item; options: string[] } // hear only → pick German
  | { t: 'tiles'; item: Item; dir: 'toEn' | 'toDe'; answer: string[]; bank: string[] }
  | { t: 'match'; items: Item[] }
  | { t: 'reply'; step: DialogueStep; options: string[] };

export const exerciseKey = (e: Exercise) => ('item' in e ? e.item.key : e.t === 'reply' ? `reply:${e.step.reply.de}` : 'match');

// ---------------- helpers ----------------

const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/** The English used for tiles: first alternative, no parentheses. */
export const primaryEn = (en: string) => en.split(' / ')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim();

export const tokens = (s: string) =>
  s
    .replace(/[.,!?;:„“”"]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

export const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:„“”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const asItems = (lesson: PathLesson): Item[] => lesson.items.map((p) => ({ ...p, key: pathItemKey(lesson.id, p) }));

function pickOthers(target: string, pool: string[], n: number): string[] {
  const seen = new Set([normalise(target)]);
  const out: string[] = [];
  for (const s of shuffle(pool)) {
    const k = normalise(s);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length === n) break;
  }
  return out;
}

/** Distractor pools: prefer phrases from the same lesson/unit (similar but different). */
function poolFor(items: Item[], field: 'de' | 'en') {
  const near = items.map((i) => i[field]);
  const far = allPathItems().map((r) => r.phrase[field]);
  return { near, far };
}

function options(target: string, items: Item[], field: 'de' | 'en', n = 3): string[] {
  const { near, far } = poolFor(items, field);
  // Single words get single-word distractors, sentences get sentences (otherwise it's too easy to guess)
  const isWord = !target.includes(' ');
  const similar = (s: string) => isWord === !s.includes(' ');
  let others = pickOthers(target, near.filter(similar), n - 1);
  if (others.length < n - 1) others = [...others, ...pickOthers(target, far.filter((s) => similar(s) && !others.includes(s)), n - 1 - others.length)];
  return shuffle([target, ...others]);
}

function tilesFor(item: Item, dir: 'toEn' | 'toDe', items: Item[]): Exercise {
  const answer = tokens(dir === 'toEn' ? primaryEn(item.en) : item.de);
  const field = dir === 'toEn' ? 'en' : 'de';
  const answerSet = new Set(answer.map(normalise));
  const extra = shuffle(
    [...new Set([...items, ...allPathItems().map((r) => ({ ...r.phrase, key: r.key }))].flatMap((i) => tokens(field === 'en' ? primaryEn(i.en) : i.de)))].filter(
      (w) => !answerSet.has(normalise(w)),
    ),
  ).slice(0, Math.min(4, Math.max(2, Math.ceil(answer.length / 2))));
  return { t: 'tiles', item, dir, answer, bank: shuffle([...answer, ...extra]) };
}

const wordCount = (s: string) => tokens(s).length;

// ---------------- builders ----------------

/**
 * A lesson: new phrases are introduced two at a time and practised right away (Babbel),
 * then built from tiles (Duolingo), heard without text (Pimsleur), matched, and used in a dialogue.
 */
export function buildLesson(unit: PathUnit, lesson: PathLesson, opts: { listening: boolean }): Exercise[] {
  const items = asItems(lesson);
  const unitIndex = PATH.indexOf(unit);
  const out: Exercise[] = [];

  // 1. Introduce in pairs, each followed by an easy recognition check
  for (let i = 0; i < items.length; i += 2) {
    const pair = items.slice(i, i + 2);
    pair.forEach((it) => out.push({ t: 'intro', item: it }));
    shuffle(pair).forEach((it) => out.push({ t: 'meaning', item: it, options: options(it.en, items, 'en') }));
  }

  // 2. A couple of phrases from earlier lessons come back (spaced recall inside the path)
  const earlier = earlierItems(lesson.id);
  shuffle(earlier)
    .slice(0, 2)
    .forEach((it) => out.push({ t: 'meaning', item: it, options: options(it.en, [...items, it], 'en') }));

  // 3. Build sentences from tiles. Early units: German → English (easier). Later: English → German.
  shuffle(items).forEach((it) => {
    if (wordCount(it.de) >= 2) out.push(tilesFor(it, unitIndex < 2 ? 'toEn' : 'toDe', items));
    else if (opts.listening) out.push({ t: 'hear', item: it, options: options(it.de, items, 'de') });
    else out.push({ t: 'meaning', item: it, options: options(it.en, items, 'en') });
  });

  // 4. Listening: pick what you heard
  if (opts.listening) shuffle(items.filter((i) => wordCount(i.de) >= 2)).slice(0, 2).forEach((it) => out.push({ t: 'hear', item: it, options: options(it.de, items, 'de') }));

  // 5. Matching pairs
  out.push({ t: 'match', items: shuffle(items).slice(0, 5) });

  // 6. From unit 3 on, also build English → German for one phrase in early units
  if (unitIndex < 2) {
    const multi = items.filter((i) => wordCount(i.de) >= 2);
    if (multi.length && unitIndex === 1) out.push(tilesFor(multi[0], 'toDe', items));
  }

  // 7. Dialogue
  lesson.dialogue?.forEach((step) => out.push({ t: 'reply', step, options: shuffle([step.reply.de, ...step.wrong]) }));

  return out;
}

/** Unit test: everything from the unit, no intros, harder formats. */
export function buildUnitTest(unit: PathUnit, opts: { listening: boolean }): Exercise[] {
  const items = unit.lessons.flatMap(asItems);
  const out: Exercise[] = [];
  shuffle(items)
    .slice(0, 10)
    .forEach((it, i) => {
      if (wordCount(it.de) >= 2 && i % 2 === 0) out.push(tilesFor(it, 'toDe', items));
      else if (opts.listening && i % 3 === 1) out.push({ t: 'hear', item: it, options: options(it.de, items, 'de') });
      else out.push({ t: 'meaning', item: it, options: options(it.en, items, 'en') });
    });
  out.push({ t: 'match', items: shuffle(items).slice(0, 5) });
  const steps = unit.lessons.flatMap((l) => l.dialogue ?? []);
  shuffle(steps)
    .slice(0, 3)
    .forEach((step) => out.push({ t: 'reply', step, options: shuffle([step.reply.de, ...step.wrong]) }));
  return out;
}

/** Review session from due item keys (spaced repetition). */
export function buildReview(keys: string[], opts: { listening: boolean }): Exercise[] {
  const items: Item[] = keys
    .map((k) => allPathItems().find((r) => r.key === k))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({ ...r.phrase, key: r.key }));
  return items.map((it, i) => {
    if (wordCount(it.de) >= 2 && i % 2 === 0) return tilesFor(it, 'toDe', items);
    if (opts.listening && i % 3 === 1) return { t: 'hear', item: it, options: options(it.de, items, 'de') };
    return { t: 'meaning', item: it, options: options(it.en, items, 'en') };
  });
}

function earlierItems(lessonId: string): Item[] {
  const out: Item[] = [];
  for (const unit of PATH)
    for (const lesson of unit.lessons) {
      if (lesson.id === lessonId) return out.slice(-15);
      out.push(...asItems(lesson));
    }
  return out.slice(-15);
}
