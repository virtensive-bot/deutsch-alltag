import { useSyncExternalStore } from 'react';
import type { AppState, Card, CustomPhrase, DayStats, Settings, SmalltalkEntry } from '../types';
import { newCard, schedule, type Grade } from './srs';
import { phrasesForScenario } from '../content';

const KEY = 'deutsch-alltag:v1';

export const DEFAULT_MODEL = 'claude-opus-5-5';

const defaultSettings: Settings = {
  apiKey: '',
  model: DEFAULT_MODEL,
  explainLang: 'en',
  voiceURI: '',
  rate: 1,
  newPerDay: 25,
  roleplayMode: 'realistic',
  aboutMe: '',
};

function initial(): AppState {
  return {
    version: 1,
    settings: { ...defaultSettings },
    cards: {},
    custom: {},
    startedScenarios: [],
    stats: {},
    numbersBest: {},
    smalltalk: { notes: {}, script: {}, drillBest: 0 },
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw) as AppState;
    return { ...initial(), ...parsed, settings: { ...defaultSettings, ...parsed.settings }, smalltalk: { ...initial().smalltalk, ...parsed.smalltalk } };
  } catch {
    return initial();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — keep in memory */
  }
}

function set(next: AppState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function bumpStats(patch: Partial<DayStats>) {
  const k = todayKey();
  const cur = state.stats[k] ?? { reviews: 0, newIntroduced: 0, roleplays: 0 };
  return {
    ...state.stats,
    [k]: {
      reviews: cur.reviews + (patch.reviews ?? 0),
      newIntroduced: cur.newIntroduced + (patch.newIntroduced ?? 0),
      roleplays: cur.roleplays + (patch.roleplays ?? 0),
    },
  };
}

export function updateSettings(patch: Partial<Settings>) {
  set({ ...state, settings: { ...state.settings, ...patch } });
}

/** Add all phrases of a scenario to the deck (as new cards). */
export function startScenario(scenarioId: string) {
  const cards = { ...state.cards };
  const now = Date.now();
  // Order of introduction: say→produce, hear→listen, then say→listen last,
  // so the two cards of one phrase never appear back to back.
  const phrases = phrasesForScenario(scenarioId);
  const plan: { key: string; kind: Card['kind'] }[] = [
    ...phrases.filter((p) => p.side === 'say').map((p) => ({ key: p.key, kind: 'produce' as const })),
    ...phrases.filter((p) => p.side === 'hear').map((p) => ({ key: p.key, kind: 'listen' as const })),
    ...phrases.filter((p) => p.side === 'say').map((p) => ({ key: p.key, kind: 'listen' as const })),
  ];
  plan.forEach(({ key, kind }, i) => {
    const id = `${key}|${kind}`;
    if (!cards[id]) cards[id] = { ...newCard(key, kind, now), added: now + i };
  });
  const started = state.startedScenarios.includes(scenarioId)
    ? state.startedScenarios
    : [...state.startedScenarios, scenarioId];
  set({ ...state, cards, startedScenarios: started });
}

export function addCustomPhrase(p: Omit<CustomPhrase, 'key' | 'created'>, kinds: Card['kind'][] = ['produce', 'listen']) {
  const now = Date.now();
  const key = `c:${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const custom = { ...state.custom, [key]: { ...p, key, created: now } };
  const cards = { ...state.cards };
  kinds.forEach((kind, i) => {
    cards[`${key}|${kind}`] = { ...newCard(key, kind, now), added: now + i };
  });
  set({ ...state, custom, cards });
  return key;
}

export function deleteCustomPhrase(key: string) {
  const custom = { ...state.custom };
  delete custom[key];
  const cards = Object.fromEntries(Object.entries(state.cards).filter(([, c]) => c.phraseKey !== key));
  set({ ...state, custom, cards });
}

export function gradeCard(cardId: string, g: Grade) {
  const card = state.cards[cardId];
  if (!card) return;
  const wasNew = card.state === 'new';
  const next = schedule(card, g);
  set({
    ...state,
    cards: { ...state.cards, [cardId]: next },
    stats: bumpStats({ reviews: 1, newIntroduced: wasNew ? 1 : 0 }),
  });
}

// ---------------- Small talk ----------------

export function setSmalltalkNote(topicId: string, text: string) {
  set({ ...state, smalltalk: { ...state.smalltalk, notes: { ...state.smalltalk.notes, [topicId]: text } } });
}

/** Save a generated script entry. Replaces (and removes from the deck) cards from a previous version. */
export function setSmalltalkEntry(topicId: string, entry: SmalltalkEntry) {
  const old = state.smalltalk.script[topicId];
  if (old?.deckKeys?.length) old.deckKeys.forEach(deleteCustomPhrase);
  set({ ...state, smalltalk: { ...state.smalltalk, script: { ...state.smalltalk.script, [topicId]: entry } } });
}

/** Add a topic's answers + questions to the deck. */
export function addSmalltalkToDeck(topicId: string, questions: { de: string; en: string; note?: string }[]) {
  const entry = state.smalltalk.script[topicId];
  if (!entry || entry.deckKeys?.length) return;
  const keys: string[] = [];
  const add = (p: { de: string; en: string; note?: string }, kinds: Card['kind'][]) =>
    keys.push(addCustomPhrase({ de: p.de, en: p.en, note: p.note, source: 'smalltalk', scenarioId: topicId }, kinds));
  add(entry.short, ['produce', 'listen']);
  add(entry.medium, ['produce']);
  add(entry.bounce, ['produce']);
  questions.forEach((q) => add(q, ['listen']));
  entry.words.slice(0, 4).forEach((w) => add(w, ['produce']));
  const cur = state.smalltalk.script[topicId];
  set({ ...state, smalltalk: { ...state.smalltalk, script: { ...state.smalltalk.script, [topicId]: { ...cur, deckKeys: keys } } } });
}

export function recordSmalltalkDrill(score: number) {
  set({ ...state, smalltalk: { ...state.smalltalk, drillBest: Math.max(state.smalltalk.drillBest, score) } });
}

export function logRoleplay() {
  set({ ...state, stats: bumpStats({ roleplays: 1 }) });
}

export function recordNumbersScore(mode: string, score: number) {
  const best = Math.max(state.numbersBest[mode] ?? 0, score);
  set({ ...state, numbersBest: { ...state.numbersBest, [mode]: best } });
}

/** Cards due now: learning/review cards past due, plus new cards up to today's limit. */
export function dueQueue(now = Date.now(), filter?: (c: Card) => boolean): Card[] {
  const all = Object.values(state.cards).filter((c) => (filter ? filter(c) : true));
  const due = all.filter((c) => c.state !== 'new' && c.due <= now).sort((a, b) => a.due - b.due);
  const introducedToday = state.stats[todayKey()]?.newIntroduced ?? 0;
  const allowance = Math.max(0, state.settings.newPerDay - introducedToday);
  const fresh = all
    .filter((c) => c.state === 'new')
    .sort((a, b) => a.added - b.added)
    .slice(0, allowance);
  // Interleave: a new card after every 3 due cards
  const out: Card[] = [];
  let f = 0;
  due.forEach((c, i) => {
    out.push(c);
    if (i % 3 === 2 && f < fresh.length) out.push(fresh[f++]);
  });
  while (f < fresh.length) out.push(fresh[f++]);
  return out;
}

export function streak(): number {
  let n = 0;
  const d = new Date();
  // today counts if active; otherwise start from yesterday
  if (!(state.stats[todayKey(d)]?.reviews || state.stats[todayKey(d)]?.roleplays)) d.setDate(d.getDate() - 1);
  for (;;) {
    const s = state.stats[todayKey(d)];
    if (!s || (!s.reviews && !s.roleplays)) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function exportData(): string {
  const { settings, ...rest } = state;
  return JSON.stringify({ ...rest, settings: { ...settings, apiKey: '' } }, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as AppState;
  if (parsed.version !== 1 || typeof parsed.cards !== 'object') throw new Error('Not a valid backup file');
  set({ ...initial(), ...parsed, settings: { ...defaultSettings, ...parsed.settings, apiKey: state.settings.apiKey }, smalltalk: { ...initial().smalltalk, ...parsed.smalltalk } });
}

export function resetProgress() {
  set({ ...initial(), settings: state.settings });
}
