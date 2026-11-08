import { SCENARIOS, phrasesForScenario } from '../content';
import { useAppState } from '../lib/store';
import { SMALLTALK_TOPICS } from '../content/smalltalk';

export default function Practice() {
  const state = useAppState();
  const cards = Object.values(state.cards);
  const scriptReady = Object.keys(state.smalltalk.script).length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>🎯 Practice</h1>
      </header>
      <p className="muted-text">Extra practice beyond the path. Start with the situations you’ve reached in your path.</p>
      <div className="grid">
        <a className="tile" href="#/numbers">
          <div className="tile-emoji">🔢</div>
          <div className="tile-title">Numbers by ear</div>
          <div className="tile-sub">Prices, times, phone numbers</div>
        </a>
        <a className="tile" href="#/capture">
          <div className="tile-emoji">📝</div>
          <div className="tile-title">I heard this…</div>
          <div className="tile-sub">Decode something you heard</div>
        </a>
      </div>

      <h2 className="section-title">Situations: all phrases + AI role-play</h2>
      <div className="grid">
        {SCENARIOS.map((sc) => {
          const keys = new Set(phrasesForScenario(sc.id).map((p) => p.key));
          const scCards = cards.filter((c) => keys.has(c.phraseKey));
          const learned = scCards.filter((c) => c.state === 'review').length;
          const pct = scCards.length ? Math.round((learned / scCards.length) * 100) : 0;
          const started = state.startedScenarios.includes(sc.id);
          return (
            <a key={sc.id} className="tile" href={`#/scenario/${sc.id}`}>
              <div className="tile-emoji">{sc.emoji}</div>
              <div className="tile-title">{sc.title}</div>
              <div className="tile-sub">
                {sc.titleDe} · {sc.level}
              </div>
              <div className="progress">
                <div style={{ width: `${pct}%` }} />
              </div>
              <div className="tile-sub">{started ? `${pct}% learned` : 'Not started'}</div>
            </a>
          );
        })}
      </div>

      <h2 className="section-title">Phase 2 · Friends & small talk</h2>
      <div className="grid">
        <a className="tile" href="#/smalltalk">
          <div className="tile-emoji">💬</div>
          <div className="tile-title">My small talk</div>
          <div className="tile-sub">Your own answers to the questions everyone asks</div>
          <div className="progress">
            <div style={{ width: `${Math.round((scriptReady / SMALLTALK_TOPICS.length) * 100)}%` }} />
          </div>
          <div className="tile-sub">
            {scriptReady}/{SMALLTALK_TOPICS.length} topics written
          </div>
        </a>
        <a className="tile" href="#/roleplay/smalltalk">
          <div className="tile-emoji">🍻</div>
          <div className="tile-title">Rapid-fire with Jonas</div>
          <div className="tile-sub">AI party guest asks question after question, with follow-ups</div>
        </a>
      </div>
      <div className="card muted">
        <p>
          Coming next: spoken German (contractions, <i>halt, doch, mal</i>), "evening with friends" group listening, and group
          role-plays.
        </p>
      </div>
    </div>
  );
}
