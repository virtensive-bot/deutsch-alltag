import { useEffect, useRef, useState } from 'react';
import AUDIO_KEYS from '../content/audio-keys.json';
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

// ---------- Recorded audio ----------
// Every fixed phrase has a pre-recorded file (scripts/make-audio.mjs). iPhones often stay
// silent with the Web Speech API (silent switch, voices that aren't downloaded), but plain
// audio files play reliably. Speech synthesis is only the fallback (AI replies, number drills).

const AUDIO = new Set<string>(AUDIO_KEYS as string[]);
const norm = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ');
/** Must match audioKey() in scripts/make-audio.mjs */
export function audioKey(text: string) {
  let h = 5381;
  for (const c of norm(text)) h = ((h << 5) + h + c.codePointAt(0)!) >>> 0;
  return h.toString(36);
}
export const hasRecording = (text: string) => AUDIO.has(audioKey(text));

let player: HTMLAudioElement | null = null;
function getPlayer() {
  if (!player) {
    player = new Audio();
    player.preload = 'auto';
    player.setAttribute('playsinline', '');
  }
  return player;
}

// A tiny silent WAV, played once inside the first tap so iOS lets this audio element
// play later without a tap (e.g. the automatic playback when a new phrase appears).
function silentWav() {
  const n = 800;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o: number, str: string) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

let playId = 0;

function playFile(text: string, opts: SpeakOpts) {
  const id = ++playId;
  const p = getPlayer();
  const { settings } = getState();
  const done = () => {
    if (id === playId) opts.onEnd?.();
  };
  const fallback = () => {
    if (id === playId) speakSynth(text, opts);
  };
  p.pause();
  p.onended = done;
  p.onerror = fallback;
  p.muted = false;
  p.src = `${import.meta.env.BASE_URL}audio/${audioKey(text)}.m4a`;
  p.playbackRate = Math.min(2, Math.max(0.5, (opts.rate ?? 1) * settings.rate));
  p.preservesPitch = true;
  p.play().catch((e: Error) => {
    // NotAllowedError: autoplay before the first tap. Nothing can play then; the user taps 🔊.
    if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') fallback();
  });
}

// iOS only allows audio/speech that starts inside a user gesture until "unlocked" once.
let unlocked = false;
function unlock() {
  if (unlocked) return;
  unlocked = true;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) nav.audioSession.type = 'playback'; // Safari 17+: play even with the silent switch on
  const p = getPlayer();
  if (!p.src) {
    const id = playId;
    p.muted = true;
    p.src = silentWav();
    p.play()
      .then(() => {
        if (id === playId) p.pause();
      })
      .catch(() => {});
  }
  if (ttsAvailable()) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}
if (typeof document !== 'undefined') {
  for (const ev of ['touchend', 'click', 'keydown'] as const) document.addEventListener(ev, unlock, { capture: true, once: true });
}

// ---------- Speech synthesis (fallback) ----------

// Keep a reference so the utterance isn't garbage-collected mid-speech (Safari/Chrome bug).
let current: SpeechSynthesisUtterance | null = null;

type SpeakOpts = { rate?: number; alt?: boolean; onEnd?: () => void };

export function speak(text: string, opts: SpeakOpts = {}) {
  unlock();
  stopSpeaking();
  if (hasRecording(text)) playFile(text, opts);
  else speakSynth(text, opts);
}

function speakSynth(text: string, opts: SpeakOpts) {
  if (!ttsAvailable()) return;
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
  playId++;
  player?.pause();
  current = null;
  if (ttsAvailable() && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
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
