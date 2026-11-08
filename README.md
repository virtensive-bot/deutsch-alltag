# Deutsch im Alltag

A personal German trainer for real-life situations in Germany: shops, trains, restaurants, and then her friends and small talk.

## Learn tab: the step-by-step path

11 units, 33 short lessons and a test per unit, from "Hallo" to small talk with her friends. Each lesson introduces 5–6 phrases two at a time, then practises them with easy tap exercises: pick the meaning, listen and choose, build the sentence from word tiles, match pairs, pick the right reply in a mini-dialogue. Mistakes come back at the end. Finished phrases go into spaced review. See [LEARNING-DESIGN.md](LEARNING-DESIGN.md) for what's borrowed from Duolingo, Babbel, Pimsleur and others. Content is in `src/content/path.ts`; exercise generation is in `src/lib/lesson.ts`.

## Practice tab (more depth)

- **10 everyday situations.** Each has a briefing, phrases you'll say, things you'll hear (listening mode), a grammar spotlight and a voiced dialogue.
- **Spaced-repetition review** (FSRS-style). "Say it" cards: type or speak the German. "Listen" cards: hear it and understand it.
- **Numbers by ear.** Prices, train times, "halb vier", dates, years, phone numbers.
- **AI role-play** (Claude). A realistic character, per-turn corrections, hints, and a debrief that turns your mistakes into cards.
- **"I heard this…" capture.** Decodes half-remembered German you heard and adds it to your deck.
- **PWA.** Install it to the iPhone home screen. Core study works offline; the AI features need a connection.

## Phase 2 (in progress)

- **My small talk** (`#/smalltalk`) covers 13 topics people always ask about (where you're from, how you met, moving to Germany?, Estonia, your work…). For each you get the real German question variants, your notes (English or Estonian) turned by Claude into your own answers (one line / three lines / 30-second story), a question to ask back, and key words. Add them to the review deck.
- **Small-talk drill.** You hear a question, answer out loud and fast (timed), and compare with your script.
- **Rapid-fire with Jonas.** An AI party guest who knows your script and digs into follow-ups you haven't prepared.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. To use the AI features, add an Anthropic API key in **Settings** (create one at console.anthropic.com). The key is stored only in this browser.

> `node_modules` and `dist` are symlinks into `*.nosync` folders so iCloud doesn't sync them.

## Put it on your iPhone

Live at **https://virtensive-bot.github.io/deutsch-alltag/** (GitHub Pages, `gh-pages` branch).

1. After changes, run `npm run deploy`. It builds and force-pushes `dist/` to `gh-pages`. Wait about a minute.
2. Open the URL in Safari, then Share → **Add to Home Screen**.
3. The installed app updates itself on the next launch after a deploy.
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

- **Phase 2 next:** spoken German (contractions, modal particles), multi-speaker "evening with friends" listening, regional dialect pack, partner mode (girlfriend records phrases).
- **Trip mode:** a pre-visit rehearsal plan and daily missions during visits.
- Higher-quality pre-generated audio for core phrases.
