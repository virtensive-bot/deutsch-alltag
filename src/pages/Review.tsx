import { useEffect, useMemo, useState } from 'react';
import { Page, MicButton, SpeakButton, compareWords, navigate, resolvePhrase } from '../components/common';
import { dueQueue, getState, gradeCard, useAppState } from '../lib/store';
import { phrasesForScenario, scenarioById } from '../content';
import { previewInterval, type Grade } from '../lib/srs';
import { speak } from '../lib/speech';
import { checkProduction, describeError, type AnswerCheck } from '../lib/claude';
import type { Card } from '../types';

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: 1, label: 'Again', cls: 'again' },
  { g: 2, label: 'Hard', cls: 'hard' },
  { g: 3, label: 'Good', cls: 'good' },
  { g: 4, label: 'Easy', cls: 'easy' },
];

export default function Review({ scope }: { scope?: string }) {
  useAppState();
  const scenario = scope ? scenarioById(scope) : undefined;
  const initial = useMemo(() => {
    if (!scenario) return dueQueue();
    const keys = new Set(phrasesForScenario(scenario.id).map((p) => p.key));
    return dueQueue(Date.now(), (c) => keys.has(c.phraseKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);
  const [queue, setQueue] = useState<string[]>(() => initial.map((c) => c.id));
  const [done, setDone] = useState(0);

  const currentId = queue[0];
  const card = currentId ? getState().cards[currentId] : undefined;

  function onGrade(g: Grade) {
    if (!card) return;
    gradeCard(card.id, g);
    const updated = getState().cards[card.id];
    setDone((d) => d + 1);
    setQueue((q) => {
      const rest = q.slice(1);
      // Learning cards come back later in this same session
      if (updated.state === 'learning') {
        const pos = Math.min(rest.length, g === 1 ? 4 : 8);
        return [...rest.slice(0, pos), card.id, ...rest.slice(pos)];
      }
      return rest;
    });
  }

  const title = scenario ? `Review · ${scenario.emoji} ${scenario.title}` : 'Review';

  if (!card) {
    return (
      <Page title={title} back={scenario ? `/scenario/${scenario.id}` : '/home'}>
        <div className="card center">
          <div className="big-emoji">{done > 0 ? '🎉' : '✅'}</div>
          <h2>{done > 0 ? `Session done — ${done} reviews` : 'Nothing due right now'}</h2>
          <p className="muted-text">
            {Object.keys(getState().cards).length === 0
              ? 'Open a situation on the home screen and add its cards to your deck.'
              : 'Come back later, or keep going with a role-play or the numbers drill.'}
          </p>
          <div className="btn-row center">
            <button className="primary" onClick={() => navigate('/home')}>
              Home
            </button>
            <button onClick={() => navigate('/numbers')}>🔢 Numbers</button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={title} back={scenario ? `/scenario/${scenario.id}` : '/home'} actions={<span className="counter">{queue.length} left</span>}>
      <CardView key={`${card.id}-${card.reps}`} card={card} onGrade={onGrade} />
    </Page>
  );
}

function CardView({ card, onGrade }: { card: Card; onGrade: (g: Grade) => void }) {
  const phrase = resolvePhrase(card.phraseKey);
  const [revealed, setRevealed] = useState(false);
  const [attempt, setAttempt] = useState('');
  const [ai, setAi] = useState<AnswerCheck | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');
  const settings = getState().settings;

  useEffect(() => {
    if (card.kind === 'listen' && phrase) speak(phrase.de);
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function reveal() {
    setRevealed(true);
    if (card.kind === 'produce' && phrase) speak(phrase.de);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        reveal();
      } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        onGrade(Number(e.key) as Grade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!phrase) {
    return (
      <div className="card">
        Missing phrase for this card. <button onClick={() => onGrade(4)}>Skip</button>
      </div>
    );
  }

  const cmp = revealed && card.kind === 'produce' && attempt.trim() ? compareWords(attempt, phrase.de) : null;
  const suggested: Grade | null = cmp ? (cmp.score > 0.9 ? 3 : cmp.score > 0.6 ? 2 : 1) : null;

  async function askAi() {
    if (!phrase) return;
    setAiBusy(true);
    setAiErr('');
    try {
      setAi(await checkProduction(settings, phrase.en, phrase.de, attempt));
    } catch (e) {
      setAiErr(describeError(e));
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="review">
      <div className="card flash">
        <div className="card-kind">
          {card.kind === 'listen' ? '👂 Listen & understand' : '🗣️ Say it in German'} <span className="source">{phrase.source}</span>
          {card.state === 'new' && <span className="new-pill">new</span>}
        </div>

        {card.kind === 'listen' ? (
          <>
            <div className="btn-row center">
              <SpeakButton text={phrase.de} label="Replay" />
              <SpeakButton text={phrase.de} rate={0.7} label="Replay slowly" />
            </div>
            {!revealed && <p className="muted-text center">What does it mean? Say it to yourself, then reveal.</p>}
            {revealed && (
              <div className="answer">
                <div className="de big">{phrase.de}</div>
                <div className="en">{phrase.en}</div>
                {phrase.note && <div className="note">{phrase.note}</div>}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="prompt-en">{phrase.en}</div>
            {!revealed && (
              <form
                className="answer-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  reveal();
                }}
              >
                <input
                  autoFocus
                  value={attempt}
                  onChange={(e) => setAttempt(e.target.value)}
                  placeholder="Type or speak the German…"
                  lang="de"
                  autoCapitalize="sentences"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <MicButton onText={(t) => setAttempt(t)} />
              </form>
            )}
            {revealed && (
              <div className="answer">
                {attempt.trim() && cmp && (
                  <div className="attempt">
                    <span className="muted-text">You: </span>
                    {attempt}
                  </div>
                )}
                <div className="de big">
                  {cmp
                    ? cmp.marked.map((m, i) => (
                        <span key={i} className={m.ok ? 'w-ok' : 'w-miss'}>
                          {m.w}{' '}
                        </span>
                      ))
                    : phrase.de}
                  <SpeakButton text={phrase.de} small />
                </div>
                {phrase.note && <div className="note">{phrase.note}</div>}
                {attempt.trim() && settings.apiKey && !ai && (
                  <button className="link" disabled={aiBusy} onClick={askAi}>
                    {aiBusy ? 'Checking…' : '🤖 Was my version also correct?'}
                  </button>
                )}
                {ai && (
                  <div className={`ai-check ${ai.verdict}`}>
                    <b>{ai.verdict === 'correct' ? '✓ Correct' : ai.verdict === 'acceptable' ? '≈ Acceptable' : '✗ Not quite'}</b> — {ai.comment}
                  </div>
                )}
                {aiErr && <div className="error">{aiErr}</div>}
              </div>
            )}
          </>
        )}
      </div>

      {!revealed ? (
        <button className="primary wide" onClick={reveal}>
          Show answer
        </button>
      ) : (
        <div className="grades">
          {GRADES.map(({ g, label, cls }) => (
            <button key={g} className={`grade ${cls}${suggested === g ? ' suggested' : ''}`} onClick={() => onGrade(g)}>
              <span>{label}</span>
              <small>{previewInterval(card, g)}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
