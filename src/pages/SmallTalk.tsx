import { useEffect, useRef, useState } from 'react';
import { KeyNotice, MicButton, Page, PhraseRow, SpeakButton, compareWords, navigate } from '../components/common';
import { SMALLTALK_TOPICS, type SmalltalkTopic } from '../content/smalltalk';
import { describeError, generateSmalltalk } from '../lib/claude';
import { speak, stopSpeaking } from '../lib/speech';
import { addSmalltalkToDeck, getState, recordSmalltalkDrill, setSmalltalkEntry, setSmalltalkNote, useAppState } from '../lib/store';
import type { Phrase, SmalltalkEntry } from '../types';

export default function SmallTalk({ sub }: { sub?: string }) {
  if (sub === 'drill') return <Drill />;
  return <Overview />;
}

// ---------------- Overview: interview → script ----------------

function Overview() {
  const state = useAppState();
  const { script, notes } = state.smalltalk;
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const ready = SMALLTALK_TOPICS.filter((t) => script[t.id]).length;
  const pending = SMALLTALK_TOPICS.filter((t) => notes[t.id]?.trim() && !script[t.id]);

  async function generate(topic: SmalltalkTopic) {
    const entry = getState().smalltalk.script[topic.id];
    if (entry?.deckKeys?.length && !confirm('Regenerating replaces the cards from this topic in your deck (their progress resets). Continue?')) return;
    setBusy((b) => new Set(b).add(topic.id));
    setErrors((e) => ({ ...e, [topic.id]: '' }));
    try {
      const s = getState();
      const result = await generateSmalltalk(s.settings, topic, s.smalltalk.notes[topic.id] ?? '');
      setSmalltalkEntry(topic.id, result);
    } catch (err) {
      setErrors((e) => ({ ...e, [topic.id]: describeError(err) }));
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(topic.id);
        return n;
      });
    }
  }

  async function generateAll() {
    // 3 at a time
    const queue = [...pending];
    const worker = async () => {
      while (queue.length) await generate(queue.shift()!);
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  return (
    <Page title="💬 My small talk" back="/home">
      <section className="card">
        <p>
          Her friends will ask you the same dozen questions every time. Write a few notes for each topic in English or Estonian, and
          Claude turns them into <b>your own German answers</b> in three lengths. Then drill them until they come out automatically.
        </p>
        <div className="btn-row">
          <button className="primary" disabled={ready === 0} onClick={() => navigate('/smalltalk/drill')}>
            ⚡ Drill ({ready} topics ready)
          </button>
          <button onClick={() => navigate('/roleplay/smalltalk')}>🍻 Rapid-fire with Jonas</button>
          {pending.length > 0 && (
            <button disabled={!state.settings.apiKey || busy.size > 0} onClick={generateAll}>
              ✨ Write all ({pending.length})
            </button>
          )}
        </div>
        {state.smalltalk.drillBest > 0 && <p className="muted-text small-text">Best drill score: {state.smalltalk.drillBest}%</p>}
      </section>
      {!state.settings.apiKey && <KeyNotice />}

      {SMALLTALK_TOPICS.map((t) => (
        <TopicCard
          key={t.id}
          topic={t}
          note={notes[t.id] ?? ''}
          entry={script[t.id]}
          busy={busy.has(t.id)}
          error={errors[t.id]}
          canGenerate={!!state.settings.apiKey}
          lang={state.settings.explainLang}
          onGenerate={() => generate(t)}
        />
      ))}
    </Page>
  );
}

function TopicCard(props: {
  topic: SmalltalkTopic;
  note: string;
  entry?: SmalltalkEntry;
  busy: boolean;
  error?: string;
  canGenerate: boolean;
  lang: 'en' | 'et';
  onGenerate: () => void;
}) {
  const { topic, note, entry, busy, error, canGenerate, lang, onGenerate } = props;
  const [level, setLevel] = useState<'short' | 'medium' | 'story'>('medium');
  const [showEn, setShowEn] = useState(false);
  const status = entry ? (entry.deckKeys?.length ? '✓ in deck' : '✓ ready') : note.trim() ? 'notes' : '';

  return (
    <details className="card topic">
      <summary>
        <span className="topic-emoji">{topic.emoji}</span>
        <b>{topic.title}</b>
        {status && <span className={`pill${entry ? ' ok' : ''}`}>{status}</span>}
      </summary>

      <h3 className="mini-title">They’ll ask</h3>
      <ul className="phrase-list compact">
        {topic.questions.map((q) => (
          <PhraseRow key={q.de} p={q} />
        ))}
        {topic.reactions?.map((q) => (
          <PhraseRow key={q.de} p={{ ...q, note: q.note ?? 'Typical reaction' }} />
        ))}
      </ul>

      <label className="field">
        <span>{lang === 'et' ? topic.askEt : topic.ask}</span>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setSmalltalkNote(topic.id, e.target.value)}
          placeholder="Notes in English or Estonian, e.g. 'Tallinn, old town, 450k people, close to Helsinki'"
        />
      </label>
      <div className="btn-row">
        <button className={entry ? '' : 'primary'} disabled={!canGenerate || busy} onClick={onGenerate}>
          {busy ? 'Writing…' : entry ? '↻ Rewrite from notes' : '✨ Write my answers'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {entry && (
        <div className="script">
          <div className="tabs" role="tablist">
            {(
              [
                ['short', 'One line'],
                ['medium', 'Three lines'],
                ['story', '30-sec story'],
              ] as const
            ).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={level === k} className={level === k ? 'active' : ''} onClick={() => setLevel(k)}>
                {label}
              </button>
            ))}
          </div>
          <div className="phrase">
            <div className="phrase-actions">
              <SpeakButton text={entry[level].de} />
              <SpeakButton text={entry[level].de} rate={0.75} small label="Play slowly" />
            </div>
            <div className="phrase-text" onClick={() => setShowEn((s) => !s)}>
              <div className="de">{entry[level].de}</div>
              {showEn ? <div className="en">{entry[level].en}</div> : <div className="hidden-text small-text">Tap for English</div>}
            </div>
          </div>

          <h3 className="mini-title">Ask back</h3>
          <ul className="phrase-list compact">
            <PhraseRow p={entry.bounce} />
          </ul>

          <h3 className="mini-title">Key words</h3>
          <ul className="word-list">
            {entry.words.map((w) => (
              <li key={w.de}>
                <b>{w.de}</b> — {w.en}
              </li>
            ))}
          </ul>
          {entry.grammar && <p className="note">💡 {entry.grammar}</p>}

          <div className="btn-row">
            {entry.deckKeys?.length ? (
              <span className="muted-text">✓ {entry.deckKeys.length} phrases in your review deck</span>
            ) : (
              <button className="primary" onClick={() => addSmalltalkToDeck(topic.id, topic.questions)}>
                ➕ Add to review deck
              </button>
            )}
          </div>
        </div>
      )}
    </details>
  );
}

// ---------------- Drill: hear a question, answer fast ----------------

const ROUND = 8;

interface DrillItem {
  topic: SmalltalkTopic;
  q: Phrase;
  entry: SmalltalkEntry;
}

function makeRound(): DrillItem[] {
  const { script } = getState().smalltalk;
  const pool = SMALLTALK_TOPICS.filter((t) => script[t.id]).flatMap((t) => t.questions.map((q) => ({ topic: t, q, entry: script[t.id] })));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  // Avoid two questions from the same topic in a row where possible
  const out: DrillItem[] = [];
  while (out.length < ROUND && shuffled.length) {
    const i = shuffled.findIndex((x) => x.topic.id !== out[out.length - 1]?.topic.id);
    out.push(shuffled.splice(i >= 0 ? i : 0, 1)[0]);
  }
  return out;
}

function Drill() {
  const [items, setItems] = useState(makeRound);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [showQ, setShowQ] = useState(false);
  const [askedAt, setAskedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState<null | { score: number; secs: number; target: Phrase; marked: { w: string; ok: boolean }[] }>(null);
  const [scores, setScores] = useState<{ score: number; secs: number }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const item = items[idx];

  function ask() {
    setAskedAt(null);
    speak(item.q.de, { alt: true, onEnd: () => setAskedAt(Date.now()) });
  }

  useEffect(() => {
    if (item && !result) ask();
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, items]);

  useEffect(() => {
    if (result || askedAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [askedAt, result]);

  if (items.length === 0) {
    return (
      <Page title="⚡ Small-talk drill" back="/smalltalk">
        <p>Write at least one topic’s answers first.</p>
      </Page>
    );
  }

  if (idx >= items.length) {
    const avg = Math.round((scores.reduce((a, s) => a + s.score, 0) / scores.length) * 100);
    const avgSecs = scores.reduce((a, s) => a + s.secs, 0) / scores.length;
    return (
      <Page title="⚡ Small-talk drill" back="/smalltalk">
        <div className="card center">
          <div className="big-emoji">{avg >= 80 ? '🏆' : avg >= 50 ? '💪' : '🌱'}</div>
          <h2>{avg}% match</h2>
          <p className="muted-text">Average answer time {avgSecs.toFixed(1)} s. Aim for under 10 s with 80%+.</p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button
              className="primary"
              onClick={() => {
                setItems(makeRound());
                setIdx(0);
                setScores([]);
                setResult(null);
              }}
            >
              Another round
            </button>
            <button onClick={() => navigate('/roleplay/smalltalk')}>🍻 Try it live with Jonas</button>
          </div>
        </div>
      </Page>
    );
  }

  const elapsed = askedAt ? (now - askedAt) / 1000 : 0;

  function check(skip = false) {
    const secs = askedAt ? (Date.now() - askedAt) / 1000 : 0;
    const candidates = [item.entry.short, item.entry.medium];
    const best = candidates
      .map((t) => ({ t, ...compareWords(skip ? '' : input, t.de) }))
      .sort((a, b) => b.score - a.score)[0];
    const r = { score: best.score, secs, target: best.t, marked: best.marked };
    setResult(r);
    setScores((s) => [...s, { score: r.score, secs: r.secs }]);
  }

  function next() {
    const n = idx + 1;
    if (n >= items.length) {
      const avg = Math.round(([...scores].reduce((a, s) => a + s.score, 0) / scores.length) * 100);
      recordSmalltalkDrill(avg);
    }
    setIdx(n);
    setInput('');
    setShowQ(false);
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <Page title="⚡ Small-talk drill" back="/smalltalk" actions={<span className="counter">{idx + 1}/{items.length}</span>}>
      <div className="card flash">
        <div className="card-kind">
          {item.topic.emoji} Someone asks you…
        </div>
        <div className="btn-row">
          <button className="icon-btn xl" onClick={ask} aria-label="Play question again">
            🔊
          </button>
          <button className="icon-btn" onClick={() => speak(item.q.de, { alt: true, rate: 0.7 })} aria-label="Play slowly">
            🐢
          </button>
          {!result && askedAt && <span className={`timer${elapsed > 10 ? ' slow' : ''}`}>{elapsed.toFixed(0)} s</span>}
        </div>
        {showQ || result ? (
          <div className="de big">{item.q.de}</div>
        ) : (
          <button className="ghost small" onClick={() => setShowQ(true)}>
            Show the question
          </button>
        )}
      </div>

      {!result ? (
        <>
          <div className="answer-input">
            <textarea
              ref={inputRef}
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Answer in German — say it out loud first, then type or dictate"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) check();
                }
              }}
            />
            <MicButton onText={(t) => setInput((s) => (s ? `${s} ${t}` : t))} />
          </div>
          <div className="btn-row">
            <button className="primary" disabled={!input.trim()} onClick={() => check()}>
              Check
            </button>
            <button className="ghost" onClick={() => check(true)}>
              I’m stuck
            </button>
          </div>
        </>
      ) : (
        <div className="card">
          <p>
            <b>{Math.round(result.score * 100)}%</b> match with your script · {result.secs.toFixed(1)} s
          </p>
          {input && <p className="attempt">You: {input}</p>}
          <p className="de diff">
            {result.marked.map((m, i) => (
              <span key={i} className={m.ok ? 'w-ok' : 'w-miss'}>
                {m.w}{' '}
              </span>
            ))}
            <SpeakButton text={result.target.de} small />
          </p>
          <p className="en">{result.target.en}</p>
          <details>
            <summary className="muted-text">30-second version</summary>
            <p>
              {item.entry.story.de} <SpeakButton text={item.entry.story.de} small />
            </p>
            <p className="en">{item.entry.story.en}</p>
          </details>
          <p className="muted-text small-text">
            Then ask back: <b>{item.entry.bounce.de}</b>
          </p>
          <div className="btn-row">
            <button className="primary" onClick={next}>
              {idx + 1 >= items.length ? 'Finish' : 'Next question'}
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}
