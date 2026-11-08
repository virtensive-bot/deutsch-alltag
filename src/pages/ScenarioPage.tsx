import { useRef, useState } from 'react';
import { scenarioById, phrasesForScenario } from '../content';
import { Page, PhraseRow, SpeakButton, navigate } from '../components/common';
import { startScenario, useAppState, dueQueue } from '../lib/store';
import { speak, stopSpeaking } from '../lib/speech';

type Tab = 'intro' | 'say' | 'hear' | 'grammar' | 'dialogue';

export default function ScenarioPage({ id }: { id: string }) {
  const s = scenarioById(id);
  const state = useAppState();
  const [tab, setTab] = useState<Tab>('intro');
  const [hideHear, setHideHear] = useState(true);
  const [hideDialogue, setHideDialogue] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const stopRef = useRef(false);

  if (!s) return <Page title="Not found" back="/home">Unknown scenario.</Page>;

  const started = state.startedScenarios.includes(s.id);
  const keys = new Set(phrasesForScenario(s.id).map((p) => p.key));
  const dueHere = dueQueue(Date.now(), (c) => keys.has(c.phraseKey)).length;

  function playDialogue(i = 0) {
    if (!s) return;
    if (i === 0) stopRef.current = false;
    if (stopRef.current || i >= s.dialogue.length) {
      setPlayingIdx(null);
      return;
    }
    setPlayingIdx(i);
    const line = s.dialogue[i];
    speak(line.de, { alt: line.who === 'them', onEnd: () => setTimeout(() => playDialogue(i + 1), 450) });
  }

  function stopDialogue() {
    stopRef.current = true;
    stopSpeaking();
    setPlayingIdx(null);
  }

  const tabs: [Tab, string][] = [
    ['intro', 'Briefing'],
    ['say', `You say (${s.say.length})`],
    ['hear', `You’ll hear (${s.hear.length})`],
    ['grammar', 'Grammar'],
    ['dialogue', 'Dialogue'],
  ];

  return (
    <Page title={`${s.emoji} ${s.title}`} back="/home">
      <div className="subtitle">
        {s.titleDe} · {s.level}
      </div>

      <div className="btn-row sticky-actions">
        {!started ? (
          <button className="primary" onClick={() => startScenario(s.id)}>
            ➕ Add {s.say.length * 2 + s.hear.length} cards to my deck
          </button>
        ) : (
          <button className="primary" disabled={dueHere === 0} onClick={() => navigate(`/review/${s.id}`)}>
            🃏 Review this ({dueHere})
          </button>
        )}
        <button onClick={() => navigate(`/roleplay/${s.id}`)}>🎭 AI role-play</button>
      </div>

      <div className="tabs" role="tablist">
        {tabs.map(([t, label]) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'intro' && (
        <div className="card">
          <ul className="bullets">
            {s.intro.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <h3>Role-play mission</h3>
          <p className="muted-text">{s.roleplay.setting}</p>
          <ul className="bullets">
            {s.roleplay.goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'say' && (
        <ul className="phrase-list">
          {s.say.map((p, i) => (
            <PhraseRow key={i} p={p} />
          ))}
        </ul>
      )}

      {tab === 'hear' && (
        <>
          <label className="toggle">
            <input type="checkbox" checked={hideHear} onChange={(e) => setHideHear(e.target.checked)} /> Listening mode: hide text
            until I tap
          </label>
          <ul className="phrase-list">
            {s.hear.map((p, i) => (
              <PhraseRow key={i} p={p} hideText={hideHear} />
            ))}
          </ul>
        </>
      )}

      {tab === 'grammar' && (
        <div className="card">
          <h3>{s.grammar.title}</h3>
          <ul className="bullets">
            {s.grammar.points.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <ul className="phrase-list compact">
            {s.grammar.examples.map((p, i) => (
              <PhraseRow key={i} p={p} />
            ))}
          </ul>
        </div>
      )}

      {tab === 'dialogue' && (
        <div className="card">
          <div className="btn-row">
            {playingIdx === null ? (
              <button className="primary" onClick={() => playDialogue(0)}>
                ▶ Play dialogue
              </button>
            ) : (
              <button onClick={stopDialogue}>⏹ Stop</button>
            )}
            <label className="toggle">
              <input type="checkbox" checked={hideDialogue} onChange={(e) => setHideDialogue(e.target.checked)} /> Hide text
            </label>
          </div>
          <div className="dialogue">
            {s.dialogue.map((l, i) => (
              <div key={i} className={`bubble ${l.who}${playingIdx === i ? ' playing' : ''}`}>
                <SpeakButton text={l.de} alt={l.who === 'them'} small />
                <div>
                  {hideDialogue && playingIdx !== i ? (
                    <div className="hidden-text">…</div>
                  ) : (
                    <>
                      <div className="de">{l.de}</div>
                      <div className="en">{l.en}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
