import { useEffect, useRef, useState } from 'react';
import { scenarioById } from '../content';
import { KeyNotice, MicButton, Page, SpeakButton, navigate } from '../components/common';
import { addCustomPhrase, logRoleplay, updateSettings, useAppState } from '../lib/store';
import { speak } from '../lib/speech';
import { describeError, roleplayDebrief, roleplayTurn, type Debrief, type RoleplayReply, type Turn } from '../lib/claude';

interface Shown {
  user?: string;
  reply?: RoleplayReply;
}

export default function Roleplay({ id }: { id: string }) {
  const scenario = scenarioById(id);
  const { settings } = useAppState();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [shown, setShown] = useState<Shown[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hideText, setHideText] = useState(settings.roleplayMode === 'realistic');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [hintsShown, setHintsShown] = useState<Set<number>>(new Set());
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [debriefBusy, setDebriefBusy] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [shown, busy, debrief]);

  async function run(history: Turn[]) {
    if (!scenario) return;
    setBusy(true);
    setError('');
    try {
      const reply = await roleplayTurn(scenario, settings, history);
      const nextTurns: Turn[] = [...history, { role: 'assistant', content: JSON.stringify(reply) }];
      setTurns(nextTurns);
      setShown((s) => {
        const copy = [...s];
        if (copy.length && !copy[copy.length - 1].reply) copy[copy.length - 1] = { ...copy[copy.length - 1], reply };
        else copy.push({ reply });
        return copy;
      });
      speak(reply.reply, { alt: true });
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!started.current && settings.apiKey && scenario) {
      started.current = true;
      run([]);
    }
  }, [settings.apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!scenario) return <Page title="Not found" back="/home">Unknown scenario.</Page>;

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const history: Turn[] = [...turns, { role: 'user', content: t }];
    setShown((s) => [...s, { user: t }]);
    setInput('');
    run(history);
  }

  function retry() {
    if (turns.length === 0) return run([]);
    const last = shown[shown.length - 1];
    if (last?.user && !last.reply) run([...turns, { role: 'user', content: last.user }]);
  }

  async function finish() {
    if (!scenario) return;
    setDebriefBusy(true);
    setError('');
    try {
      setDebrief(await roleplayDebrief(scenario, settings, turns));
      logRoleplay();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setDebriefBusy(false);
    }
  }

  const lastReply = [...shown].reverse().find((s) => s.reply)?.reply;
  const learnerTurns = turns.filter((t) => t.role === 'user').length;

  return (
    <Page
      title={`🎭 ${scenario.title}`}
      back={scenario.id === 'smalltalk' ? '/smalltalk' : `/scenario/${scenario.id}`}
      actions={
        <select
          className="mode-select"
          value={settings.roleplayMode}
          onChange={(e) => updateSettings({ roleplayMode: e.target.value as 'realistic' | 'supportive' })}
          aria-label="Difficulty"
          disabled={turns.length > 0}
        >
          <option value="realistic">Realistic</option>
          <option value="supportive">Supportive</option>
        </select>
      }
    >
      {!settings.apiKey && <KeyNotice />}

      <details className="card mission">
        <summary>
          <b>Your mission</b> — {scenario.roleplay.setting}
        </summary>
        <ul className="bullets">
          {scenario.roleplay.goals.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      </details>

      <label className="toggle">
        <input type="checkbox" checked={hideText} onChange={(e) => setHideText(e.target.checked)} /> Listen first: hide their text
        until I tap
      </label>

      <div className="chat">
        {shown.map((s, i) => (
          <div key={i}>
            {s.user && <div className="bubble you">{s.user}</div>}
            {s.user && s.reply && <FeedbackBox fb={s.reply.feedback} />}
            {s.reply && (
              <div className="bubble them" onClick={() => setRevealed((r) => new Set(r).add(i))}>
                <SpeakButton text={s.reply.reply} alt small />
                <div>
                  {hideText && !revealed.has(i) ? (
                    <div className="hidden-text">🎧 Tap to show text</div>
                  ) : (
                    <>
                      <div className="de">{s.reply.reply}</div>
                      <div className="en">{s.reply.reply_en}</div>
                    </>
                  )}
                </div>
              </div>
            )}
            {s.reply && s === shown[shown.length - 1] && !s.reply.finished && !debrief && (
              <div className="hint-row">
                {hintsShown.has(i) ? (
                  <div className="hint">
                    💡 <span className="de">{s.reply.hint}</span> <span className="en">— {s.reply.hint_en}</span>
                  </div>
                ) : (
                  <button className="link" onClick={() => setHintsShown((h) => new Set(h).add(i))}>
                    💡 Hint
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="bubble them typing">…</div>}
        {error && (
          <div className="error">
            {error} <button className="link" onClick={retry}>Retry</button>
          </div>
        )}

        {debrief && (
          <div className="card debrief">
            <h2>Debrief</h2>
            <p>{debrief.summary}</p>
            {debrief.strengths.length > 0 && (
              <>
                <h3>✅ What went well</h3>
                <ul className="bullets">
                  {debrief.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            {debrief.mistakes.length > 0 && (
              <>
                <h3>🔧 Fix these</h3>
                <ul className="mistakes">
                  {debrief.mistakes.map((m, i) => (
                    <li key={i}>
                      <div className="w-miss">{m.wrong}</div>
                      <div className="w-ok">→ {m.right}</div>
                      <div className="muted-text">{m.why}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {debrief.phrases.length > 0 && (
              <>
                <h3>📌 Phrases to drill</h3>
                <ul className="phrase-list compact">
                  {debrief.phrases.map((p, i) => (
                    <li key={i} className="phrase">
                      <SpeakButton text={p.de} small />
                      <div className="phrase-text">
                        <div className="de">{p.de}</div>
                        <div className="en">{p.en}</div>
                        {p.note && <div className="note">{p.note}</div>}
                      </div>
                      <button
                        className="small"
                        disabled={added.has(i)}
                        onClick={() => {
                          addCustomPhrase({ de: p.de, en: p.en, note: p.note, source: 'roleplay', scenarioId: scenario.id });
                          setAdded((a) => new Set(a).add(i));
                        }}
                      >
                        {added.has(i) ? '✓ Added' : '+ Deck'}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={added.size === debrief.phrases.length}
                  onClick={() => {
                    debrief.phrases.forEach((p, i) => {
                      if (!added.has(i)) addCustomPhrase({ de: p.de, en: p.en, note: p.note, source: 'roleplay', scenarioId: scenario.id });
                    });
                    setAdded(new Set(debrief.phrases.map((_, i) => i)));
                  }}
                >
                  Add all to deck
                </button>
              </>
            )}
            <div className="btn-row">
              <button
                className="primary"
                onClick={() => {
                  setTurns([]);
                  setShown([]);
                  setDebrief(null);
                  setAdded(new Set());
                  setRevealed(new Set());
                  setHintsShown(new Set());
                  run([]);
                }}
              >
                Play again
              </button>
              <button onClick={() => navigate(scenario.id === 'smalltalk' ? '/smalltalk' : `/scenario/${scenario.id}`)}>Back</button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!debrief && settings.apiKey && (
        <div className="composer">
          {(lastReply?.finished || learnerTurns >= 3) && (
            <button className={lastReply?.finished ? 'primary wide' : 'link'} disabled={debriefBusy || busy} onClick={finish}>
              {debriefBusy ? 'Preparing debrief…' : lastReply?.finished ? '🏁 Finish & get debrief' : 'End & get debrief'}
            </button>
          )}
          {!lastReply?.finished && (
            <form
              className="answer-input"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Antworte auf Deutsch…"
                lang="de"
                disabled={busy || turns.length === 0}
                autoCorrect="off"
                spellCheck={false}
              />
              <MicButton onText={(t) => send(t)} disabled={busy || turns.length === 0} />
              <button type="submit" className="primary" disabled={busy || !input.trim()}>
                ➤
              </button>
            </form>
          )}
        </div>
      )}
    </Page>
  );
}

function FeedbackBox({ fb }: { fb: RoleplayReply['feedback'] }) {
  if (fb.verdict === 'start') return null;
  const label = {
    perfect: '✓ Perfect',
    good: '👍 Good',
    error: '✗ Correction',
    not_german: '🇩🇪 In German, please',
  }[fb.verdict];
  const same = (a: string) => !a;
  return (
    <div className={`feedback ${fb.verdict}`}>
      <b>{label}</b>
      {!same(fb.corrected) && (
        <div>
          <span className="muted-text">Correct: </span>
          <span className="de">{fb.corrected}</span>
        </div>
      )}
      {!same(fb.natural) && (
        <div>
          <span className="muted-text">Natural: </span>
          <span className="de">{fb.natural}</span> <SpeakButton text={fb.natural} small />
        </div>
      )}
      {fb.explanation && <div className="muted-text">{fb.explanation}</div>}
    </div>
  );
}
