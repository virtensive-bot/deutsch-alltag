import { useEffect, useMemo, useRef, useState } from 'react';
import { PATH_STEPS } from '../content/path';
import { navigate } from '../components/common';
import { buildLesson, buildReview, buildUnitTest, exerciseKey, normalise, primaryEn, type Exercise, type Item } from '../lib/lesson';
import { speak, stopSpeaking, ttsAvailable } from '../lib/speech';
import { completePathStep, duePathKeys, getState, setListening, useAppState } from '../lib/store';

type Feedback = null | { ok: boolean; correct?: string; de?: string };

export default function Lesson({ id }: { id: string }) {
  useAppState();
  const step = PATH_STEPS.find((s) => s.id === id);
  const listening = getState().path.listening && ttsAvailable();
  const [queue, setQueue] = useState<Exercise[]>(() => {
    const opts = { listening };
    if (id === 'review') return buildReview(duePathKeys(), opts);
    if (!step) return [];
    return step.test ? buildUnitTest(step.unit, opts) : buildLesson(step.unit, step.lesson!, opts);
  });
  const [pos, setPos] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const results = useRef<Record<string, boolean>>({});
  const retried = useRef<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);
  const total = queue.length;
  const ex = queue[pos];
  if (import.meta.env.DEV) (window as unknown as { __ex: unknown }).__ex = ex; // for automated testing

  function record(key: string, ok: boolean) {
    if (!(key in results.current)) results.current[key] = ok;
  }

  function answer(ok: boolean, correct?: string, de?: string) {
    if (ex.t !== 'match' && ex.t !== 'intro') record(exerciseKey(ex), ok);
    if (!ok && !retried.current.has(pos)) {
      retried.current.add(pos);
      setQueue((q) => [...q, ex]); // mistakes come back at the end
    }
    setFeedback({ ok, correct, de });
    if (de) speak(de);
  }

  function next() {
    stopSpeaking();
    setFeedback(null);
    if (pos + 1 >= queue.length) setFinished(true);
    else setPos(pos + 1);
  }

  function cantListen() {
    setListening(false);
    // Replace remaining listening exercises with reading ones
    setQueue((q) => q.map((e, i) => (i >= pos && e.t === 'hear' ? { t: 'meaning', item: e.item, options: shuffleEn(e.item, q) } : e)));
  }

  if (!queue.length) {
    return (
      <div className="page">
        <p>{id === 'review' ? 'Nothing to review right now. 🎉' : 'Lesson not found.'}</p>
        <button onClick={() => navigate('/home')}>Back</button>
      </div>
    );
  }

  if (finished) return <Finish id={id} results={results.current} />;

  const progress = Math.round((pos / total) * 100);

  return (
    <div className="lesson">
      <header className="lesson-head">
        <button className="close" aria-label="Close lesson" onClick={() => (pos < 2 || confirm('Quit this lesson? Progress in it will be lost.')) && navigate('/home')}>
          ✕
        </button>
        <div className="progress lesson-progress">
          <div style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="lesson-body" key={pos}>
        {ex.t === 'intro' && <Intro item={ex.item} />}
        {ex.t === 'meaning' && <Choice key={pos} prompt={<GermanPrompt item={ex.item} />} title="What does this mean?" options={ex.options} correct={ex.item.en} de={ex.item.de} locked={!!feedback} onAnswer={answer} />}
        {ex.t === 'hear' && (
          <Choice
            key={pos}
            title="What do you hear?"
            prompt={<HearPrompt text={ex.item.de} onCantListen={cantListen} />}
            options={ex.options}
            correct={ex.item.de}
            de={ex.item.de}
            locked={!!feedback}
            onAnswer={answer}
          />
        )}
        {ex.t === 'tiles' && <Tiles key={pos} ex={ex} locked={!!feedback} onAnswer={answer} />}
        {ex.t === 'match' && <Match key={pos} items={ex.items} onDone={(mistakes) => { mistakes.forEach((k) => record(k, false)); setFeedback({ ok: true }); }} />}
        {ex.t === 'reply' && (
          <Choice
            key={pos}
            title="What do you say?"
            prompt={<ReplyPrompt them={ex.step.them} />}
            options={ex.options}
            correct={ex.step.reply.de}
            de={ex.step.reply.de}
            locked={!!feedback}
            onAnswer={answer}
            hint={ex.step.reply.en}
          />
        )}
      </div>

      <footer className={`lesson-foot${feedback ? (feedback.ok ? ' ok' : ' bad') : ''}`}>
        {ex.t === 'intro' && !feedback && (
          <button className="primary big-btn" onClick={next}>
            Continue
          </button>
        )}
        {feedback && (
          <>
            <div className="fb-text">
              {feedback.ok ? (
                <b>{['Richtig! 🎉', 'Super! 👏', 'Genau! ✨', 'Sehr gut! 💪'][pos % 4]}</b>
              ) : (
                <>
                  <b>Not quite. Correct answer:</b>
                  <div>{feedback.correct}</div>
                  <div className="small-text">It will come back at the end.</div>
                </>
              )}
            </div>
            <button className="primary big-btn" onClick={next}>
              Continue
            </button>
          </>
        )}
      </footer>
    </div>
  );
}

function shuffleEn(item: Item, q: Exercise[]) {
  const pool = [...new Set(q.flatMap((e) => ('item' in e ? [e.item.en] : [])).filter((en) => en !== item.en))];
  return [item.en, ...pool.slice(0, 2)].sort(() => Math.random() - 0.5);
}

// ---------------- Exercise components ----------------

function useAutoSpeak(text: string, enabled = true) {
  useEffect(() => {
    if (enabled) {
      const t = setTimeout(() => speak(text), 250);
      return () => clearTimeout(t);
    }
  }, [text, enabled]);
}

function Intro({ item }: { item: Item }) {
  useAutoSpeak(item.de);
  return (
    <div className="ex">
      <div className="ex-label">✨ New phrase</div>
      <div className="intro-card">
        <div className="de huge">{item.de}</div>
        <div className="en">{item.en}</div>
        {item.note && <div className="note">{item.note}</div>}
        <div className="btn-row center-row">
          <button className="icon-btn xl" onClick={() => speak(item.de)} aria-label="Play">
            🔊
          </button>
          <button className="icon-btn" onClick={() => speak(item.de, { rate: 0.7 })} aria-label="Play slowly">
            🐢
          </button>
        </div>
        <p className="muted-text small-text">Listen, then say it out loud once.</p>
      </div>
    </div>
  );
}

function GermanPrompt({ item }: { item: Item }) {
  useAutoSpeak(item.de);
  return (
    <div className="prompt-row">
      <button className="icon-btn" onClick={() => speak(item.de)} aria-label="Play">
        🔊
      </button>
      <div className="de big">{item.de}</div>
    </div>
  );
}

function HearPrompt({ text, onCantListen }: { text: string; onCantListen: () => void }) {
  useAutoSpeak(text);
  return (
    <div className="center">
      <div className="btn-row center-row">
        <button className="icon-btn xl" onClick={() => speak(text)} aria-label="Play">
          🔊
        </button>
        <button className="icon-btn" onClick={() => speak(text, { rate: 0.65 })} aria-label="Play slowly">
          🐢
        </button>
      </div>
      <button className="ghost small" onClick={onCantListen}>
        Can’t listen now
      </button>
    </div>
  );
}

function ReplyPrompt({ them }: { them: { de: string; en: string } }) {
  const [showEn, setShowEn] = useState(false);
  useAutoSpeak(them.de);
  return (
    <div className="chat">
      <div>
        <div className="bubble them" onClick={() => setShowEn((s) => !s)}>
          <button className="icon-btn small" onClick={(e) => { e.stopPropagation(); speak(them.de); }} aria-label="Play">
            🔊
          </button>{' '}
          <span className="de">{them.de}</span>
          <div className="en small-text">{showEn ? them.en : 'Tap for English'}</div>
        </div>
      </div>
    </div>
  );
}

function Choice(props: {
  title: string;
  prompt: React.ReactNode;
  options: string[];
  correct: string;
  de: string;
  locked: boolean;
  hint?: string;
  onAnswer: (ok: boolean, correct?: string, de?: string) => void;
}) {
  const { title, prompt, options, correct, de, locked, onAnswer } = props;
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="ex">
      <div className="ex-label">{title}</div>
      {prompt}
      <div className="options">
        {options.map((o) => (
          <button
            key={o}
            className={`option${sel === o ? ' selected' : ''}${locked && o === correct ? ' right' : ''}${locked && sel === o && o !== correct ? ' wrong' : ''}`}
            disabled={locked}
            onClick={() => setSel(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {!locked && (
        <button className="primary big-btn check" disabled={!sel} onClick={() => onAnswer(normalise(sel!) === normalise(correct), correct, de)}>
          Check
        </button>
      )}
    </div>
  );
}

function Tiles({ ex, locked, onAnswer }: { ex: Extract<Exercise, { t: 'tiles' }>; locked: boolean; onAnswer: (ok: boolean, correct?: string, de?: string) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const toEn = ex.dir === 'toEn';
  useAutoSpeak(ex.item.de, toEn);
  const target = toEn ? primaryEn(ex.item.en) : ex.item.de;
  return (
    <div className="ex">
      <div className="ex-label">{toEn ? 'Translate into English' : 'Say it in German'}</div>
      {toEn ? <GermanPrompt item={ex.item} /> : <div className="de big en-prompt">{ex.item.en}</div>}
      <div className="tile-answer">
        {picked.map((i) => (
          <button key={i} className="word-tile" disabled={locked} onClick={() => setPicked((p) => p.filter((x) => x !== i))}>
            {ex.bank[i]}
          </button>
        ))}
      </div>
      <div className="tile-bank">
        {ex.bank.map((w, i) => (
          <button key={i} className={`word-tile${picked.includes(i) ? ' used' : ''}`} disabled={locked || picked.includes(i)} onClick={() => setPicked((p) => [...p, i])}>
            {w}
          </button>
        ))}
      </div>
      {!locked && (
        <button
          className="primary big-btn check"
          disabled={!picked.length}
          onClick={() => onAnswer(normalise(picked.map((i) => ex.bank[i]).join(' ')) === normalise(ex.answer.join(' ')), target, ex.item.de)}
        >
          Check
        </button>
      )}
    </div>
  );
}

function Match({ items, onDone }: { items: Item[]; onDone: (mistakes: string[]) => void }) {
  const left = useMemo(() => [...items].sort(() => Math.random() - 0.5), [items]);
  const right = useMemo(() => [...items].sort(() => Math.random() - 0.5), [items]);
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const mistakes = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!selL || !selR) return;
    if (selL === selR) {
      const m = new Set(matched).add(selL);
      setMatched(m);
      if (m.size === items.length) onDone([...mistakes.current]);
    } else {
      mistakes.current.add(selL);
      setWrong(selL + selR);
      setTimeout(() => setWrong(null), 500);
    }
    setSelL(null);
    setSelR(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selL, selR]);

  return (
    <div className="ex">
      <div className="ex-label">Tap the matching pairs</div>
      <div className="match">
        <div>
          {left.map((it) => (
            <button
              key={it.key}
              className={`option${selL === it.key ? ' selected' : ''}${matched.has(it.key) ? ' matched' : ''}${wrong?.startsWith(it.key) ? ' wrong' : ''}`}
              disabled={matched.has(it.key)}
              onClick={() => {
                speak(it.de);
                setSelL(it.key);
              }}
            >
              {it.de}
            </button>
          ))}
        </div>
        <div>
          {right.map((it) => (
            <button
              key={it.key}
              className={`option${selR === it.key ? ' selected' : ''}${matched.has(it.key) ? ' matched' : ''}${wrong?.endsWith(it.key) ? ' wrong' : ''}`}
              disabled={matched.has(it.key)}
              onClick={() => setSelR(it.key)}
            >
              {primaryEn(it.en)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Finish ----------------

function Finish({ id, results }: { id: string; results: Record<string, boolean> }) {
  const vals = Object.values(results);
  const acc = vals.length ? Math.round((vals.filter(Boolean).length / vals.length) * 100) : 100;
  const xp = (id === 'review' ? 5 : 10) + (acc >= 90 ? 5 : 0);
  const saved = useRef(false);
  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    if (id === 'review') completePathStep('review', results, xp);
    else completePathStep(id, results, xp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="page lesson-finish">
      <div className="big-emoji">{acc >= 90 ? '🏆' : acc >= 70 ? '🎉' : '💪'}</div>
      <h1>{id === 'review' ? 'Review done!' : 'Lesson complete!'}</h1>
      <div className="stats-row">
        <div className="stat">
          <b>+{xp}</b>
          <span>XP</span>
        </div>
        <div className="stat">
          <b>{acc}%</b>
          <span>first-try correct</span>
        </div>
      </div>
      <p className="muted-text">These phrases are now in your review. They’ll come back right before you’d forget them.</p>
      <button className="primary big-btn" onClick={() => navigate('/home')}>
        Continue
      </button>
    </div>
  );
}
