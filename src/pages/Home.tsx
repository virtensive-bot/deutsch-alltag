import { SCENARIOS, phrasesForScenario } from '../content';
import { dueQueue, streak, todayKey, useAppState } from '../lib/store';
import { navigate } from '../components/common';

export default function Home() {
  const state = useAppState();
  const queue = dueQueue();
  const dueReviews = queue.filter((c) => c.state !== 'new').length;
  const newToday = queue.length - dueReviews;
  const today = state.stats[todayKey()];
  const cards = Object.values(state.cards);
  const mature = cards.filter((c) => c.state === 'review' && c.stability >= 7).length;
  const s = streak();

  const nextScenario = SCENARIOS.find((sc) => !state.startedScenarios.includes(sc.id));

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="eyebrow">Deutsch im Alltag</div>
          <h1>Hallo! 👋</h1>
        </div>
        <div className="stats-row">
          <div className="stat">
            <b>{s}</b>
            <span>day streak</span>
          </div>
          <div className="stat">
            <b>{today?.reviews ?? 0}</b>
            <span>reviews today</span>
          </div>
          <div className="stat">
            <b>{mature}</b>
            <span>phrases solid</span>
          </div>
        </div>
      </header>

      <section className="card today">
        <h2>Today</h2>
        {cards.length === 0 ? (
          <p>Start with the <b>Conversation survival kit</b> below — it adds its phrases to your review deck.</p>
        ) : queue.length === 0 ? (
          <p>All caught up. 🎉 Do a role-play or a numbers drill to keep going.</p>
        ) : (
          <p>
            <b>{dueReviews}</b> due · <b>{newToday}</b> new
          </p>
        )}
        <div className="btn-row">
          {queue.length > 0 && (
            <button className="primary" onClick={() => navigate('/review')}>
              Start review
            </button>
          )}
          {nextScenario && (
            <button onClick={() => navigate(`/scenario/${nextScenario.id}`)}>
              Next: {nextScenario.emoji} {nextScenario.title}
            </button>
          )}
          <button onClick={() => navigate('/numbers')}>🔢 Numbers drill</button>
        </div>
      </section>

      <h2 className="section-title">Phase 1 · Everyday situations</h2>
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
      <div className="card muted">
        <p>
          Coming next: your personal small-talk script, spoken German (contractions, <i>halt, doch, mal</i>), multi-speaker
          "evening with friends" listening, and partner mode. Get through Phase 1 first — <b>Meeting her friends</b> and{' '}
          <b>Guest at her family</b> are the bridge.
        </p>
      </div>
    </div>
  );
}
