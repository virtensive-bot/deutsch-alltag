export interface Phrase {
  de: string;
  en: string;
  /** Usage note, register, or a colloquial variant */
  note?: string;
}

export interface DialogueLine {
  who: 'you' | 'them';
  de: string;
  en: string;
}

export interface Scenario {
  id: string;
  emoji: string;
  title: string;
  titleDe: string;
  level: 'A1' | 'A2' | 'B1';
  /** Culture notes and practical tips */
  intro: string[];
  /** Things you will want to say */
  say: Phrase[];
  /** Things Germans will say to you — the listening challenge */
  hear: Phrase[];
  grammar: {
    title: string;
    points: string[];
    examples: Phrase[];
  };
  dialogue: DialogueLine[];
  roleplay: {
    /** Who Claude plays */
    character: string;
    setting: string;
    /** Tasks the learner must accomplish */
    goals: string[];
    /** Realistic complications Claude may throw in */
    curveballs: string[];
  };
}

export type CardKind = 'listen' | 'produce';
export type CardState = 'new' | 'learning' | 'review';

export interface Card {
  id: string; // `${phraseKey}|${kind}`
  phraseKey: string;
  kind: CardKind;
  state: CardState;
  stability: number; // days
  difficulty: number; // 1..10
  due: number; // epoch ms
  last: number | null;
  reps: number;
  lapses: number;
  added: number;
}

/** A phrase that lives outside the built-in scenarios (captured, from role-play debriefs) */
export interface CustomPhrase extends Phrase {
  key: string;
  source: 'capture' | 'roleplay';
  scenarioId?: string;
  created: number;
}

export interface Settings {
  apiKey: string;
  model: string;
  explainLang: 'en' | 'et';
  voiceURI: string;
  rate: number;
  newPerDay: number;
  roleplayMode: 'realistic' | 'supportive';
  aboutMe: string;
}

export interface DayStats {
  reviews: number;
  newIntroduced: number;
  roleplays: number;
}

export interface AppState {
  version: 1;
  settings: Settings;
  cards: Record<string, Card>;
  custom: Record<string, CustomPhrase>;
  startedScenarios: string[];
  stats: Record<string, DayStats>; // key: YYYY-MM-DD
  numbersBest: Record<string, number>;
}
