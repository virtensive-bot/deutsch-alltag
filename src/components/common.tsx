import { useEffect, useState, type ReactNode } from 'react';
import { speak, sttAvailable, useDictation } from '../lib/speech';
import { lookupBuiltin } from '../content';
import { getState } from '../lib/store';
import type { Phrase } from '../types';

export function navigate(path: string) {
  window.location.hash = path;
}

export function useRoute(): string[] {
  const parse = () => (window.location.hash.replace(/^#\/?/, '') || 'home').split('/');
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function SpeakButton({ text, rate, alt, label, small }: { text: string; rate?: number; alt?: boolean; label?: string; small?: boolean }) {
  return (
    <button
      type="button"
      className={`icon-btn${small ? ' small' : ''}`}
      aria-label={label ?? `Play: ${text}`}
      title={label ?? 'Play'}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, { rate, alt });
      }}
    >
      {rate && rate < 1 ? '🐢' : '🔊'}
    </button>
  );
}

export function MicButton({ onText, disabled }: { onText: (t: string) => void; disabled?: boolean }) {
  const d = useDictation(onText);
  if (!sttAvailable()) return null;
  return (
    <>
      <button
        type="button"
        className={`icon-btn mic${d.listening ? ' live' : ''}`}
        aria-label={d.listening ? 'Stop listening' : 'Speak German'}
        title={d.listening ? 'Stop' : 'Speak (German)'}
        disabled={disabled}
        onClick={d.toggle}
      >
        {d.listening ? '⏹' : '🎙️'}
      </button>
      {(d.interim || d.error) && <div className="mic-interim">{d.error || d.interim}</div>}
    </>
  );
}

export function PhraseRow({ p, hideText }: { p: Phrase; hideText?: boolean }) {
  const [shown, setShown] = useState(!hideText);
  useEffect(() => setShown(!hideText), [hideText]);
  return (
    <li className="phrase" onClick={() => !shown && setShown(true)}>
      <div className="phrase-actions">
        <SpeakButton text={p.de} />
        <SpeakButton text={p.de} rate={0.7} label="Play slowly" small />
      </div>
      <div className="phrase-text">
        {shown ? (
          <>
            <div className="de">{p.de}</div>
            <div className="en">{p.en}</div>
            {p.note && <div className="note">{p.note}</div>}
          </>
        ) : (
          <div className="hidden-text">Listen, then tap to reveal</div>
        )}
      </div>
    </li>
  );
}

export function resolvePhrase(key: string): (Phrase & { source: string }) | undefined {
  const b = lookupBuiltin(key);
  if (b) return { ...b.phrase, source: `${b.scenario.emoji} ${b.scenario.title}` };
  const c = getState().custom[key];
  if (c) return { de: c.de, en: c.en, note: c.note, source: c.source === 'capture' ? '📝 Captured' : '🎭 From role-play' };
  return undefined;
}

export function Page({ title, back, children, actions }: { title: string; back?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page">
      <header className="page-head">
        {back !== undefined && (
          <button className="back" onClick={() => (back ? navigate(back) : history.back())} aria-label="Back">
            ‹
          </button>
        )}
        <h1>{title}</h1>
        <div className="head-actions">{actions}</div>
      </header>
      {children}
    </div>
  );
}

export function KeyNotice() {
  return (
    <div className="notice">
      AI features need your Anthropic API key. <a href="#/settings">Add it in Settings</a>.
    </div>
  );
}

/** Very small word-level diff for showing the learner what differs from the target. */
export function compareWords(attempt: string, target: string) {
  const norm = (w: string) => w.toLowerCase().replace(/[.,!?;:"„“”‚‘’'()…—–-]/g, '').replace(/ß/g, 'ss');
  const a = attempt.split(/\s+/).filter(Boolean).map(norm);
  const words = target.split(/\s+/).filter(Boolean);
  const pool = [...a];
  let hits = 0;
  const marked = words.map((w) => {
    const i = pool.indexOf(norm(w));
    const ok = i >= 0;
    if (ok) {
      pool.splice(i, 1);
      hits++;
    }
    return { w, ok };
  });
  const score = words.length ? hits / Math.max(words.length, a.length) : 0;
  return { marked, score };
}
