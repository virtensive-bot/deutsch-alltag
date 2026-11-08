import type { Phrase, Scenario } from '../types';
import { scenariosA } from './scenarios-a';
import { scenariosB } from './scenarios-b';

export const SCENARIOS: Scenario[] = [...scenariosA, ...scenariosB];

/** Stable short hash so phrase keys survive reordering of content. */
function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export const phraseKey = (scenarioId: string, p: Phrase) => `${scenarioId}:${hash(p.de)}`;

interface IndexedPhrase {
  key: string;
  phrase: Phrase;
  scenario: Scenario;
  side: 'say' | 'hear';
}

const INDEX = new Map<string, IndexedPhrase>();
for (const s of SCENARIOS) {
  for (const side of ['say', 'hear'] as const) {
    for (const p of s[side]) {
      const key = phraseKey(s.id, p);
      INDEX.set(key, { key, phrase: p, scenario: s, side });
    }
  }
}

export function lookupBuiltin(key: string) {
  return INDEX.get(key);
}

export function phrasesForScenario(scenarioId: string): IndexedPhrase[] {
  return [...INDEX.values()].filter((p) => p.scenario.id === scenarioId);
}

export function scenarioById(id: string) {
  return SCENARIOS.find((s) => s.id === id);
}
