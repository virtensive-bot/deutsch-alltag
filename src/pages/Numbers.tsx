import { useEffect, useRef, useState } from 'react';
import { Page } from '../components/common';
import { DRILL_MODES, checkNumber, type DrillMode, type NumberItem } from '../lib/numbers';
import { speak } from '../lib/speech';
import { recordNumbersScore, useAppState } from '../lib/store';

const ROUND = 10;

export default function Numbers() {
  const state = useAppState();
  const [mode, setMode] = useState<DrillMode | null>(null);

  if (!mode) {
    return (
      <Page title="🔢 Numbers by ear">
        <p className="muted-text">
          Numbers are where real conversations break down: prices at the till, train times, "halb vier". Listen and type what you
          hear. Rounds of {ROUND}. Natural speed by default — use 🐢 only when stuck.
        </p>
        <div className="grid">
          {DRILL_MODES.map((m) => (
            <button key={m.id} className="tile" onClick={() => setMode(m)}>
              <div className="tile-title">{m.title}</div>
              <div className="tile-sub">{m.desc}</div>
              {state.numbersBest[m.id] !== undefined && <div className="tile-sub">Best: {state.numbersBest[m.id]}/{ROUND}</div>}
            </button>
          ))}
        </div>
      </Page>
    );
  }
  return <Drill key={mode.id} mode={mode} onExit={() => setMode(null)} />;
}

function Drill({ mode, onExit }: { mode: DrillMode; onExit: () => void }) {
  const [item, setItem] = useState<NumberItem>(() => mode.make());
  const [n, setN] = useState(1);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const [fast, setFast] = useState(false);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const play = (rate = fast ? 1.25 : 1) => speak(item.speech, { rate });

  useEffect(() => {
    if (!finished) {
      play();
      inputRef.current?.focus();
    }
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit() {
    if (result !== null) return next();
    if (!input.trim()) return;
    const ok = checkNumber(item, input);
    setResult(ok);
    if (ok) setScore((s) => s + 1);
  }

  function next() {
    if (n >= ROUND) {
      recordNumbersScore(mode.id, score);
      setFinished(true);
      return;
    }
    setN(n + 1);
    setInput('');
    setResult(null);
    setItem(mode.make());
  }

  if (finished) {
    return (
      <Page title={mode.title}>
        <div className="card center">
          <div className="big-emoji">{score >= 9 ? '🏆' : score >= 7 ? '💪' : '📈'}</div>
          <h2>
            {score} / {ROUND}
          </h2>
          <p className="muted-text">{score >= 9 ? 'Excellent. Try the fast mode next.' : 'Again! Repetition is the whole trick with numbers.'}</p>
          <div className="btn-row center">
            <button
              className="primary"
              onClick={() => {
                setFinished(false);
                setN(1);
                setScore(0);
                setInput('');
                setResult(null);
                setItem(mode.make());
              }}
            >
              Another round
            </button>
            <button onClick={onExit}>Other drills</button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={mode.title}
      actions={
        <span className="counter">
          {n}/{ROUND} · ✓{score}
        </span>
      }
    >
      <button className="back-inline" onClick={onExit}>
        ‹ All drills
      </button>
      <div className="card flash center">
        <div className="btn-row center">
          <button className="icon-btn xl" onClick={() => play()} aria-label="Play">
            🔊
          </button>
          <button className="icon-btn" onClick={() => play(0.7)} aria-label="Play slowly">
            🐢
          </button>
        </div>
        <label className="toggle center">
          <input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} /> Fast (×1.25)
        </label>
        <form
          className="answer-input"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={item.placeholder}
            inputMode="decimal"
            readOnly={result !== null}
          />
          <button type="submit" className="primary">
            {result === null ? 'Check' : 'Next'}
          </button>
        </form>
        {result !== null && (
          <div className={`result ${result ? 'ok' : 'bad'}`}>
            <b>{result ? '✓ Richtig!' : `✗ Answer: ${item.answer}`}</b>
            <div>{item.explain}</div>
            <div className="de">“{item.speech}”</div>
          </div>
        )}
      </div>
    </Page>
  );
}
