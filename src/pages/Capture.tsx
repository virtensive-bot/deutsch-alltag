import { useState } from 'react';
import { KeyNotice, MicButton, Page, SpeakButton } from '../components/common';
import { addCustomPhrase, deleteCustomPhrase, useAppState } from '../lib/store';
import { describeError, explainCapture, type CaptureResult } from '../lib/claude';

export default function Capture() {
  const state = useAppState();
  const { settings } = state;
  const [heard, setHeard] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [saved, setSaved] = useState(false);

  async function explain() {
    if (!heard.trim()) return;
    setBusy(true);
    setError('');
    setResult(null);
    setSaved(false);
    try {
      setResult(await explainCapture(settings, heard.trim(), context.trim()));
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!result) return;
    addCustomPhrase({ de: result.german, en: result.english, note: result.register, source: 'capture' }, ['listen', 'produce']);
    setSaved(true);
  }

  const custom = Object.values(state.custom).sort((a, b) => b.created - a.created);

  return (
    <Page title="📝 I heard this…">
      <p className="muted-text">
        Heard something you didn’t understand — at the till, on the train, from her friends? Write it down however you remember it
        (spelling doesn’t matter) and get it decoded. Then add it to your deck.
      </p>
      {!settings.apiKey && <KeyNotice />}
      <div className="card">
        <label className="field">
          What you heard or saw
          <div className="answer-input">
            <textarea
              rows={2}
              value={heard}
              onChange={(e) => setHeard(e.target.value)}
              placeholder='e.g. "hasse ma n euro" or "Störung im Betriebsablauf"'
              lang="de"
            />
            <MicButton onText={(t) => setHeard((h) => (h ? `${h} ${t}` : t))} />
          </div>
        </label>
        <label className="field">
          Context (optional)
          <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. a friend at dinner, laughing" />
        </label>
        <button className="primary" disabled={busy || !heard.trim() || !settings.apiKey} onClick={explain}>
          {busy ? 'Decoding…' : 'Explain it'}
        </button>
        {error && <div className="error">{error}</div>}
      </div>

      {result && (
        <div className="card">
          <div className="de big">
            {result.german} <SpeakButton text={result.german} small /> <SpeakButton text={result.german} rate={0.7} small />
          </div>
          <div className="en">{result.english}</div>
          <dl className="capture-dl">
            <dt>Literally</dt>
            <dd>{result.literal}</dd>
            <dt>Breakdown</dt>
            <dd>{result.breakdown}</dd>
            <dt>Register</dt>
            <dd>{result.register}</dd>
          </dl>
          {result.reply_options.length > 0 && (
            <>
              <h3>You could reply</h3>
              <ul className="phrase-list compact">
                {result.reply_options.map((r, i) => (
                  <li key={i} className="phrase">
                    <SpeakButton text={r.de} small />
                    <div className="phrase-text">
                      <div className="de">{r.de}</div>
                      <div className="en">{r.en}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button className="primary" disabled={saved} onClick={save}>
            {saved ? '✓ Added to deck' : '+ Add to my deck'}
          </button>
        </div>
      )}

      <h2 className="section-title">My phrases ({custom.length})</h2>
      {custom.length === 0 ? (
        <p className="muted-text">Captured phrases and role-play debrief phrases will appear here.</p>
      ) : (
        <ul className="phrase-list">
          {custom.map((c) => (
            <li key={c.key} className="phrase">
              <SpeakButton text={c.de} small />
              <div className="phrase-text">
                <div className="de">{c.de}</div>
                <div className="en">{c.en}</div>
                {c.note && <div className="note">{c.note}</div>}
              </div>
              <button className="small ghost" aria-label="Delete" onClick={() => confirm(`Delete "${c.de}"?`) && deleteCustomPhrase(c.key)}>
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
