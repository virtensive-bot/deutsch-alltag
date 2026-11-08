import { useRef, useState } from 'react';
import { Page } from '../components/common';
import { exportData, importData, resetProgress, updateSettings, useAppState } from '../lib/store';
import { speak, useGermanVoices } from '../lib/speech';

const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 — best feedback (default)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 — faster, cheaper' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 — fastest, cheapest' },
];

export default function SettingsPage() {
  const { settings } = useAppState();
  const voices = useGermanVoices();
  const [keyDraft, setKeyDraft] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function download() {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deutsch-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Page title="⚙️ Settings">
      <section className="card">
        <h2>Claude API</h2>
        <label className="field">
          Anthropic API key
          <div className="answer-input">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="small ghost" onClick={() => setShowKey((s) => !s)}>
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <div className="btn-row">
          <button
            className="primary"
            disabled={keyDraft.trim() === settings.apiKey}
            onClick={() => {
              updateSettings({ apiKey: keyDraft.trim() });
              setMsg('Key saved on this device.');
            }}
          >
            Save key
          </button>
          {msg && <span className="muted-text">{msg}</span>}
        </div>
        <p className="muted-text small-text">
          Create a key at console.anthropic.com → API Keys. It is stored only in this browser on this device and sent only to
          api.anthropic.com. Set a monthly spend limit in the Console for peace of mind.
        </p>
        <label className="field">
          Model
          <select value={settings.model} onChange={(e) => updateSettings({ model: e.target.value })}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Explanations in
          <select value={settings.explainLang} onChange={(e) => updateSettings({ explainLang: e.target.value as 'en' | 'et' })}>
            <option value="en">English</option>
            <option value="et">Eesti keel</option>
          </select>
        </label>
        <label className="field">
          Role-play difficulty
          <select value={settings.roleplayMode} onChange={(e) => updateSettings({ roleplayMode: e.target.value as 'realistic' | 'supportive' })}>
            <option value="realistic">Realistic — natural speed & colloquial, no hand-holding</option>
            <option value="supportive">Supportive — clearer standard German</option>
          </select>
        </label>
        <label className="field">
          <span>
            About me (used in role-plays so people ask about <i>your</i> life)
          </span>
          <textarea
            rows={4}
            value={settings.aboutMe}
            onChange={(e) => updateSettings({ aboutMe: e.target.value })}
            placeholder="e.g. Mart, from Tallinn. Work in health-tech. Girlfriend Liis (also Estonian) lives in Munich; I visit monthly. Like running and sailing."
          />
        </label>
      </section>

      <section className="card">
        <h2>Voice & study</h2>
        <label className="field">
          German voice
          <div className="answer-input">
            <select value={settings.voiceURI} onChange={(e) => updateSettings({ voiceURI: e.target.value })}>
              <option value="">Automatic (best available)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <button type="button" className="small" onClick={() => speak('Hallo! Ich hätte gern zwei Brötchen, bitte.')}>
              Test
            </button>
          </div>
        </label>
        {voices.length === 0 && <p className="error">No German voice found on this device.</p>}
        <p className="muted-text small-text">
          <b>No sound on iPhone?</b> Speech is muted when the phone is on silent: flip the ring/silent switch (or Action button) to
          ring and turn the volume up. If it still stays quiet, pick a voice above that isn’t “Enhanced/Premium” (those need to be
          downloaded first), or leave it on Automatic.
        </p>
        <p className="muted-text small-text">
          Tip: on iPhone/Mac, download a better voice in Settings → Accessibility → Spoken Content → Voices → German (e.g.
          “Anna (Enhanced)” or a Premium voice).
        </p>
        <label className="field">
          Speech speed: {settings.rate.toFixed(2)}×
          <input type="range" min={0.6} max={1.4} step={0.05} value={settings.rate} onChange={(e) => updateSettings({ rate: Number(e.target.value) })} />
        </label>
        <label className="field">
          New cards per day: {settings.newPerDay}
          <input type="range" min={5} max={60} step={5} value={settings.newPerDay} onChange={(e) => updateSettings({ newPerDay: Number(e.target.value) })} />
        </label>
      </section>

      <section className="card">
        <h2>Your data</h2>
        <p className="muted-text small-text">Progress is saved in this browser. Export a backup to move it to another device.</p>
        <div className="btn-row">
          <button onClick={download}>⬇ Export backup</button>
          <button onClick={() => fileRef.current?.click()}>⬆ Import backup</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                importData(await f.text());
                setMsg('Backup imported.');
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Import failed');
              }
              e.target.value = '';
            }}
          />
          <button className="danger" onClick={() => confirm('Reset all progress? This cannot be undone.') && resetProgress()}>
            Reset progress
          </button>
        </div>
      </section>
    </Page>
  );
}
