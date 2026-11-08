import Anthropic from '@anthropic-ai/sdk';
import type { Phrase, Scenario, Settings, SmalltalkEntry } from '../types';
import { getState } from './store';
import { SMALLTALK_TOPICS, type SmalltalkTopic } from '../content/smalltalk';

export interface Turn {
  role: 'user' | 'assistant';
  /** For the assistant: the raw JSON it returned. For the user: what they said. */
  content: string;
}

export interface RoleplayFeedback {
  verdict: 'perfect' | 'good' | 'error' | 'not_german' | 'start';
  corrected: string;
  natural: string;
  explanation: string;
}

export interface RoleplayReply {
  feedback: RoleplayFeedback;
  reply: string;
  reply_en: string;
  hint: string;
  hint_en: string;
  finished: boolean;
}

export interface Debrief {
  summary: string;
  strengths: string[];
  mistakes: { wrong: string; right: string; why: string }[];
  phrases: { de: string; en: string; note: string }[];
}

export interface CaptureResult {
  german: string;
  english: string;
  literal: string;
  breakdown: string;
  register: string;
  reply_options: { de: string; en: string }[];
}

export class MissingKeyError extends Error {
  constructor() {
    super('Add your Anthropic API key in Settings to use AI features.');
  }
}

function client(settings: Settings) {
  if (!settings.apiKey) throw new MissingKeyError();
  return new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
}

const langName = (s: Settings) => (s.explainLang === 'et' ? 'Estonian' : 'English');

/** Call Claude with a JSON schema and parse the structured result. */
async function structured<T>(
  settings: Settings,
  opts: { system: string; messages: Anthropic.Beta.BetaMessageParam[]; schema: Record<string, unknown>; effort: 'low' | 'medium'; maxTokens?: number },
): Promise<T> {
  const response = await client(settings).beta.messages.create({
    model: settings.model,
    max_tokens: opts.maxTokens ?? 16000,
    system: opts.system,
    messages: opts.messages,
    output_config: { effort: opts.effort, format: { type: 'json_schema', schema: opts.schema } },
    cache_control: { type: 'ephemeral' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude declined this request. Try rephrasing.');
  if (response.stop_reason === 'max_tokens') throw new Error('The response was cut off. Please try again.');
  const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  return JSON.parse(text) as T;
}

export function describeError(e: unknown): string {
  if (e instanceof MissingKeyError) return e.message;
  if (e instanceof Anthropic.AuthenticationError) return 'Your API key was rejected. Check it in Settings.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'This API key has no access to the selected model.';
  if (e instanceof Anthropic.RateLimitError) return 'Rate limited — wait a moment and try again.';
  if (e instanceof Anthropic.BadRequestError) return `Request error: ${e.message}`;
  if (e instanceof Anthropic.APIConnectionError) return 'No connection to the Claude API. Are you online?';
  if (e instanceof Anthropic.APIError) return `API error ${e.status}: ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}

// ---------------- Role-play ----------------

const replySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['feedback', 'reply', 'reply_en', 'hint', 'hint_en', 'finished'],
  properties: {
    feedback: {
      type: 'object',
      additionalProperties: false,
      required: ['verdict', 'corrected', 'natural', 'explanation'],
      properties: {
        verdict: { type: 'string', enum: ['perfect', 'good', 'error', 'not_german', 'start'] },
        corrected: { type: 'string', description: "Learner's sentence with only the errors fixed. Empty if perfect or start." },
        natural: { type: 'string', description: 'How a native would most naturally say it in this situation. Empty if identical.' },
        explanation: { type: 'string', description: 'Short, concrete explanation of errors/upgrades. Empty if nothing to say.' },
      },
    },
    reply: { type: 'string', description: 'Your in-character spoken German reply.' },
    reply_en: { type: 'string', description: 'Translation of reply.' },
    hint: { type: 'string', description: 'One good thing the learner could say next, in German.' },
    hint_en: { type: 'string' },
    finished: { type: 'boolean', description: 'True when the interaction has naturally ended.' },
  },
} as const;

export function roleplaySystem(s: Scenario, settings: Settings) {
  const realistic = settings.roleplayMode === 'realistic';
  return `You are running a German speaking-practice role-play for an adult learner (native Estonian, fluent English, roughly A1→A2, wants to be challenged and learn fast). They regularly visit their girlfriend, who is also Estonian and lives in Germany; the people they talk to in German are her (mostly German) friends, colleagues and people in daily life.

SCENE: ${s.roleplay.setting}
YOUR CHARACTER: ${s.roleplay.character}
LEARNER'S GOALS: ${s.roleplay.goals.map((g) => `\n- ${g}`).join('')}
POSSIBLE COMPLICATIONS (use 1–2 naturally, not all): ${s.roleplay.curveballs.map((g) => `\n- ${g}`).join('')}
${settings.aboutMe ? `\nABOUT THE LEARNER (use for personal questions): ${settings.aboutMe}` : ''}
${s.id === 'smalltalk' ? smalltalkContext() : ''}

STYLE:
${
  realistic
    ? `- Speak like a real person in Germany would: natural speed, everyday colloquial forms (e.g. "'ne", "hab", "gibt's", "noch was?"), short turns. Do NOT simplify into textbook German, and do not switch to English.
- Don't slow down unless the learner explicitly asks (e.g. "Wie bitte?", "Langsamer, bitte") — then rephrase more simply, as a real person would.`
    : `- Speak clearly in standard German with short sentences, but still natural. Rephrase more simply if they seem lost.`
}
- Stay fully in character in "reply". Keep each reply to 1–3 short sentences, like real spoken interaction.
- If the learner writes English or Estonian, react in character with mild confusion and keep going in German (verdict "not_german"; in "natural" give the German they needed).

FEEDBACK (outside the character):
- Judge ONLY the learner's latest message. verdict: "perfect" (correct and natural), "good" (understandable, minor issues or a more natural option exists), "error" (grammar/word errors that matter), "start" (only for the very first turn when there's no learner message yet).
- Be demanding: flag wrong articles/cases, verb position, du/Sie mismatch, and unnatural phrasing — but keep explanations brief and concrete, written in ${langName(settings)}. German examples stay in German.
- "hint" = a useful next line pitched slightly ABOVE their current level, so they stretch.
- Set "finished" true when the interaction has ended naturally (goodbye said, purchase complete, etc.).`;
}

export async function roleplayTurn(scenario: Scenario, settings: Settings, history: Turn[]): Promise<RoleplayReply> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: 'user', content: '[The scene begins. Open the interaction in character — the learner has just approached you. Use verdict "start".]' },
    ...history,
  ];
  return structured<RoleplayReply>(settings, {
    system: roleplaySystem(scenario, settings),
    messages,
    schema: replySchema,
    effort: 'low',
    maxTokens: 4000,
  });
}

const debriefSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'strengths', 'mistakes', 'phrases'],
  properties: {
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    mistakes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['wrong', 'right', 'why'],
        properties: { wrong: { type: 'string' }, right: { type: 'string' }, why: { type: 'string' } },
      },
    },
    phrases: {
      type: 'array',
      description: 'Up to 6 high-value German phrases from or for this conversation that the learner should drill.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['de', 'en', 'note'],
        properties: { de: { type: 'string' }, en: { type: 'string' }, note: { type: 'string' } },
      },
    },
  },
} as const;

export async function roleplayDebrief(scenario: Scenario, settings: Settings, history: Turn[]): Promise<Debrief> {
  const transcript = history
    .map((t) => {
      if (t.role === 'user') return `LEARNER: ${t.content}`;
      try {
        return `PARTNER: ${(JSON.parse(t.content) as RoleplayReply).reply}`;
      } catch {
        return `PARTNER: ${t.content}`;
      }
    })
    .join('\n');
  return structured<Debrief>(settings, {
    system: `You are a demanding but encouraging German coach. The learner (native Estonian, A1→A2, wants fast progress) just did a role-play: "${scenario.title}" — ${scenario.roleplay.setting}. Write explanations in ${langName(settings)}; German stays German. Prioritise the mistakes that would matter most in real life. Phrases should be ones they'll reuse in this situation, including things they tried to say but couldn't.`,
    messages: [{ role: 'user', content: `Transcript:\n${transcript}\n\nGive the debrief.` }],
    schema: debriefSchema,
    effort: 'medium',
  });
}

// ---------------- Small talk ----------------

function smalltalkContext() {
  const { script, notes } = getState().smalltalk;
  const lines = SMALLTALK_TOPICS.map((t) => {
    const e = script[t.id];
    if (e) return `- ${t.title}: ${e.medium.de}`;
    if (notes[t.id]?.trim()) return `- ${t.title} (notes): ${notes[t.id].trim()}`;
    return null;
  }).filter(Boolean);
  return `
RAPID-FIRE SMALL TALK: This is a getting-to-know-you drill. Ask ONE question per turn, mostly from these topics: ${SMALLTALK_TOPICS.map((t) => t.title).join(', ')}. Vary how you phrase them (colloquial variants). After an answer, react briefly like a real person (Echt? Krass. Ach, cool.) and then either dig deeper with a follow-up about a detail the learner mentioned (this is where they must improvise) or switch topic. Share small bits about yourself too, so the learner can ask back. Keep going for 12+ exchanges; don't end it yourself unless the learner says goodbye.
${lines.length ? `THE LEARNER'S PREPARED ANSWERS (use them to ask relevant follow-ups the learner has NOT prepared):\n${lines.join('\n')}` : ''}`;
}

const phraseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['de', 'en'],
  properties: { de: { type: 'string' }, en: { type: 'string' } },
} as const;

const smalltalkSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['short', 'medium', 'story', 'bounce', 'words', 'grammar'],
  properties: {
    short: { ...phraseSchema, description: 'One-sentence answer (quick reply at a party).' },
    medium: { ...phraseSchema, description: 'Three-sentence answer with one interesting detail.' },
    story: { ...phraseSchema, description: '~30-second spoken version (5–7 sentences), Perfekt for past events, a little humour or personality.' },
    bounce: { ...phraseSchema, description: 'A natural question to ask back on the same topic (du-form).' },
    words: {
      type: 'array',
      description: '4–6 key words/chunks from the answers that the learner needs, with article and plural for nouns.',
      items: { ...phraseSchema },
    },
    grammar: { type: 'string', description: 'One short note on the most useful grammar point in these answers.' },
  },
} as const;

export async function generateSmalltalk(settings: Settings, topic: SmalltalkTopic, notes: string): Promise<SmalltalkEntry> {
  const others = Object.entries(getState().smalltalk.notes)
    .filter(([id, n]) => id !== topic.id && n.trim())
    .map(([id, n]) => `${id}: ${n.trim()}`)
    .join('\n');
  const r = await structured<Omit<SmalltalkEntry, 'generated'>>(settings, {
    system: `You write a personal small-talk script in German for an adult learner (native Estonian, fluent English, A1→A2, wants to be challenged and progress fast). Their girlfriend is also Estonian and lives in Germany; they talk German with her German friends at parties, dinners, bars.

Rules:
- Spoken, natural German as a real person would say it among friends (du-form, common spoken chunks like "eigentlich", "halt", "ziemlich", "ehrlich gesagt"), but grammatically correct — they will memorise it.
- Pitch it slightly above their level: A2+/B1 structures (Perfekt, weil/dass with verb at the end, seit + present) but short sentences they can actually say out loud.
- Use ONLY facts from their notes and profile; never invent facts about their life. If a detail is missing, keep that part generic or use "…" as a slot.
- English translations are natural, not literal.
- The grammar note is written in ${langName(settings)}.`,
    messages: [
      {
        role: 'user',
        content: `Topic: ${topic.title}
Questions people ask: ${topic.questions.map((q: Phrase) => q.de).join(' | ')}
My notes (any language): ${notes.trim() || '(none — keep it generic with slots)'}
${settings.aboutMe ? `About me: ${settings.aboutMe}` : ''}
${others ? `My notes on other topics (for consistency, don't repeat them):\n${others}` : ''}`,
      },
    ],
    schema: smalltalkSchema,
    effort: 'medium',
    maxTokens: 6000,
  });
  return { ...r, generated: Date.now() };
}

// ---------------- Capture ("I heard this") ----------------

const captureSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['german', 'english', 'literal', 'breakdown', 'register', 'reply_options'],
  properties: {
    german: { type: 'string', description: 'Most likely correct German, properly spelled.' },
    english: { type: 'string', description: 'Natural meaning in English.' },
    literal: { type: 'string', description: 'Word-by-word literal translation.' },
    breakdown: { type: 'string', description: 'Key words/grammar/colloquial contractions explained briefly.' },
    register: { type: 'string', description: 'Formal/informal/slang/regional, where you would hear it.' },
    reply_options: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['de', 'en'],
        properties: { de: { type: 'string' }, en: { type: 'string' } },
      },
    },
  },
} as const;

export async function explainCapture(settings: Settings, heard: string, context: string): Promise<CaptureResult> {
  return structured<CaptureResult>(settings, {
    system: `You help a German learner (native Estonian, A1→A2) decode German they heard or saw in daily life in Germany. The input may be misspelled or written phonetically from memory — reconstruct the most likely real German. Explain colloquial contractions and regional forms. Write explanations in ${langName(settings)}. Give 2–3 natural reply options they could actually use.`,
    messages: [{ role: 'user', content: `What I heard/saw: "${heard}"${context ? `\nContext: ${context}` : ''}` }],
    schema: captureSchema,
    effort: 'low',
    maxTokens: 4000,
  });
}

// ---------------- Answer check for production cards ----------------

export interface AnswerCheck {
  verdict: 'correct' | 'acceptable' | 'wrong';
  comment: string;
}

export async function checkProduction(settings: Settings, english: string, target: string, attempt: string): Promise<AnswerCheck> {
  return structured<AnswerCheck>(settings, {
    system: `You grade a German learner's translation. Accept any natural, correct German that fits the situation, even if it differs from the reference. "acceptable" = correct meaning, small slip or less natural. Comment in ${langName(settings)} in one or two short sentences; quote German fixes.`,
    messages: [{ role: 'user', content: `English prompt: ${english}\nReference German: ${target}\nLearner wrote: ${attempt}` }],
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['verdict', 'comment'],
      properties: { verdict: { type: 'string', enum: ['correct', 'acceptable', 'wrong'] }, comment: { type: 'string' } },
    },
    effort: 'low',
    maxTokens: 2000,
  });
}
