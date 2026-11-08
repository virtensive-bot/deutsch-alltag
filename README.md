# Deutsch im Alltag

A personal German trainer for real-life situations in Germany: shops, trains, restaurants, and then her friends and small talk.

## What's in it (MVP: Phase 1)

- **10 everyday situations.** Each has a briefing, phrases you'll say, things you'll hear (listening mode), a grammar spotlight and a voiced dialogue.
- **Spaced-repetition review** (FSRS-style). "Say it" cards: type or speak the German. "Listen" cards: hear it and understand it.
- **Numbers by ear.** Prices, train times, "halb vier", dates, years, phone numbers.
- **AI role-play** (Claude). A realistic character, per-turn corrections, hints, and a debrief that turns your mistakes into cards.
- **"I heard this…" capture.** Decodes half-remembered German you heard and adds it to your deck.
- **PWA.** Install it to the iPhone home screen. Core study works offline; the AI features need a connection.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. To use the AI features, add an Anthropic API key in **Settings** (create one at console.anthropic.com). The key is stored only in this browser.

> `node_modules` and `dist` are symlinks into `*.nosync` folders so iCloud doesn't sync them.

## Put it on your iPhone

1. `npm run build`. The `dist/` folder is a static site.
2. Host it anywhere static and HTTPS (Cloudflare Pages, Netlify, GitHub Pages).
3. Open the URL in Safari, then Share → **Add to Home Screen**.
4. Enter your API key once in Settings on the phone.

Progress is stored per device. Use Settings → Export / Import to move it.

## Project layout

- `src/content/` holds the scenarios (phrases, dialogues, role-play briefs). Add or edit situations here.
- `src/lib/srs.ts` is the spaced-repetition scheduler.
- `src/lib/claude.ts` has the Claude calls (role-play, debrief, capture, answer check), all with structured JSON output.
- `src/lib/speech.ts` handles text-to-speech and German speech recognition (Web Speech API).
- `src/lib/numbers.ts` generates German number words and the listening drills.
- `src/pages/` contains the screens.

## Roadmap

- **Phase 2:** a personal small-talk script, spoken German (contractions, modal particles), multi-speaker "evening with friends" listening, regional dialect pack, partner mode (girlfriend records phrases).
- **Trip mode:** a pre-visit rehearsal plan and daily missions during visits.
- Higher-quality pre-generated audio for core phrases.
