// Collects every fixed German string the app can speak, for audio generation.
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const mods = await Promise.all(
  ['/src/content/index.ts', '/src/content/path.ts', '/src/content/smalltalk.ts'].map((m) => server.ssrLoadModule(m)),
);
const out = new Set();
const walk = (v, key) => {
  if (typeof v === 'string') {
    if (key === 'de' || key === 'wrong') out.add(v.trim());
    return;
  }
  if (Array.isArray(v)) return v.forEach((x) => walk(x, key === 'wrong' ? 'wrong' : undefined));
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
};
for (const m of mods) for (const v of Object.values(m)) if (typeof v !== 'function') walk(v);
out.add('Hallo! Ich hätte gern zwei Brötchen, bitte.');
await server.close();
process.stdout.write(JSON.stringify([...out].filter(Boolean), null, 0));
