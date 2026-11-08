// Generates public/audio/<hash>.m4a for every fixed German phrase (macOS only: uses `say` + `afconvert`).
// iPhones often play nothing through the Web Speech API (silent switch, missing voices),
// but plain audio files always work. Run: node scripts/make-audio.mjs
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
const run = promisify(execFile);

const texts = JSON.parse((await run('node', ['scripts/collect-phrases.mjs'], { maxBuffer: 1 << 24 })).stdout);
const VOICE = process.env.VOICE ?? 'Anna';
const RATE = process.env.RATE ?? '165';
const dir = 'public/audio';
mkdirSync(dir, { recursive: true });

// Must match audioKey() in src/lib/speech.ts
const norm = (s) => s.normalize('NFC').trim().replace(/\s+/g, ' ');
const audioKey = (s) => {
  let h = 5381;
  for (const c of norm(s)) h = ((h << 5) + h + c.codePointAt(0)) >>> 0;
  return h.toString(36);
};

const keys = new Set();
let made = 0;
const queue = [...texts];
async function worker() {
  for (let t; (t = queue.shift()); ) {
    const k = audioKey(t);
    keys.add(k);
    const file = join(dir, `${k}.m4a`);
    if (existsSync(file)) continue;
    const aiff = join(tmpdir(), `say-${k}.aiff`);
    // "…" is read out oddly; make it a pause
    await run('say', ['-v', VOICE, '-r', RATE, '-o', aiff, t.replace(/…/g, ',')]);
    await run('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '40000', '-c', '1', aiff, file]);
    rmSync(aiff);
    made++;
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
writeFileSync('src/content/audio-keys.json', JSON.stringify([...keys].sort()));
console.log(`${texts.length} phrases, ${made} new files`);
