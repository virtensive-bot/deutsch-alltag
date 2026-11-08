import { useEffect, useRef, useState } from 'react';
import { getState } from './store';

// ---------- Text to speech ----------

let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (typeof speechSynthesis === 'undefined') return [];
  cachedVoices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('de'));
  return cachedVoices;
}

export function germanVoices(): SpeechSynthesisVoice[] {
  return cachedVoices.length ? cachedVoices : refreshVoices();
}

export function useGermanVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => refreshVoices());
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    const onChange = () => setVoices(refreshVoices());
    speechSynthesis.addEventListener('voiceschanged', onChange);
    return () => speechSynthesis.removeEventListener('voiceschanged', onChange);
  }, []);
  return voices;
}

/** Rank voices: prefer premium/enhanced/natural voices, then de-DE. */
function pickVoice(preferredURI: string, alt = false): SpeechSynthesisVoice | undefined {
  const voices = germanVoices();
  if (!voices.length) return undefined;
  const novelty = /grandma|grandpa|rocko|bad news|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|bahh|fred|junior|kathy|ralph/i;
  const score = (v: SpeechSynthesisVoice) =>
    (/premium|enhanced|natural|neural/i.test(v.name) ? 10 : 0) +
    (/^(anna|helena|markus|petra|yannick|viktor)/i.test(v.name) ? 4 : 0) +
    (v.lang === 'de-DE' ? 2 : 0) +
    (v.localService ? 1 : 0) -
    (novelty.test(v.name) ? 50 : 0);
  const ranked = [...voices].sort((a, b) => score(b) - score(a));
  const preferred = voices.find((v) => v.voiceURI === preferredURI) ?? ranked[0];
  if (!alt) return preferred;
  return ranked.find((v) => v.voiceURI !== preferred.voiceURI) ?? preferred;
}

export const ttsAvailable = () => typeof speechSynthesis !== 'undefined';

// iOS Safari only allows speech that starts inside a user gesture until the engine
// has been "unlocked" once. Speak a silent utterance on the first touch/click.
let unlocked = false;
function unlock() {
  if (unlocked || !ttsAvailable()) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}
if (typeof document !== 'undefined') {
  for (const ev of ['touchend', 'click', 'keydown'] as const) document.addEventListener(ev, unlock, { capture: true, once: true });
}

// Keep a reference so the utterance isn't garbage-collected mid-speech (Safari/Chrome bug).
let current: SpeechSynthesisUtterance | null = null;

export function speak(text: string, opts: { rate?: number; alt?: boolean; onEnd?: () => void } = {}) {
  if (!ttsAvailable()) return;
  unlock();
  const { settings } = getState();
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  speechSynthesis.resume(); // iOS sometimes leaves the engine paused

  const make = (withVoice: boolean) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    if (withVoice) {
      const v = pickVoice(settings.voiceURI, opts.alt);
      if (v) u.voice = v;
    }
    u.rate = (opts.rate ?? 1) * settings.rate;
    const done = () => {
      if (current === u) {
        current = null;
        opts.onEnd?.();
      }
    };
    u.onend = done;
    u.onerror = done;
    return u;
  };

  const u = make(true);
  let started = false;
  u.onstart = () => (started = true);
  current = u;
  speechSynthesis.speak(u);

  // Fallback: some iPhone voices are listed but silent (not downloaded), and iOS
  // occasionally drops an utterance. If nothing started, retry with the system default.
  setTimeout(() => {
    if (started || current !== u) return;
    const retry = make(false);
    current = retry;
    speechSynthesis.cancel();
    setTimeout(() => {
      if (current === retry) speechSynthesis.speak(retry);
    }, 60);
  }, 1200);
}

export function stopSpeaking() {
  current = null;
  if (ttsAvailable()) speechSynthesis.cancel();
}

// ---------- Speech recognition ----------

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function recognitionCtor(): (new () => RecognitionLike) | undefined {
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const sttAvailable = () => typeof window !== 'undefined' && !!recognitionCtor();

/** Push-to-talk German speech recognition. */
export function useDictation(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef<RecognitionLike | null>(null);
  const finalRef = useRef('');
  const cbRef = useRef(onFinal);
  cbRef.current = onFinal;

  useEffect(() => () => recRef.current?.abort(), []);

  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser. Try Safari or Chrome.');
      return;
    }
    stopSpeaking();
    const rec = new Ctor();
    rec.lang = 'de-DE';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    finalRef.current = '';
    setInterim('');
    setError('');
    rec.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(finalRef.current + interimText);
    };
    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') setError(`Mic error: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      const text = finalRef.current.trim();
      if (text) cbRef.current(text);
      setInterim('');
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stop() {
    recRef.current?.stop();
  }

  return { listening, interim, error, start, stop, toggle: () => (listening ? stop() : start()) };
}
