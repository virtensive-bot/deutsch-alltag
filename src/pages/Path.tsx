import { PATH, PATH_STEPS } from '../content/path';
import { navigate } from '../components/common';
import { DAILY_XP_GOAL, duePathKeys, streak, todayKey, useAppState } from '../lib/store';

export default function Path() {
  const state = useAppState();
  const done = state.path.done;
  const xpToday = state.path.xp[todayKey()] ?? 0;
  const s = streak();
  const due = duePathKeys().length;
  const nextIdx = PATH_STEPS.findIndex((st) => !done[st.id]);
  const next = nextIdx >= 0 ? PATH_STEPS[nextIdx] : null;
  const goalPct = Math.min(100, Math.round((xpToday / DAILY_XP_GOAL) * 100));

  function open(stepId: string, locked: boolean) {
    if (locked && !confirm('This lesson is still locked. Jump ahead anyway?')) return;
    navigate(`/lesson/${stepId}`);
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="eyebrow">Deutsch im Alltag</div>
          <h1>Hallo! 👋</h1>
        </div>
        <div className="stats-row">
          <div className="stat">
            <b>🔥 {s}</b>
            <span>day streak</span>
          </div>
          <div className="stat goal">
            <b>
              {xpToday}/{DAILY_XP_GOAL}
            </b>
            <span>XP today</span>
            <div className="progress">
              <div style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        </div>
      </header>

      <section className="card today">
        {next ? (
          <>
            <div className="eyebrow">
              {next.unit.emoji} Unit {PATH.indexOf(next.unit) + 1} · {next.unit.title}
            </div>
            <h2>{next.test ? 'Unit test' : next.lesson!.title}</h2>
            <p className="muted-text">{next.test ? 'Show what you’ve learned in this unit.' : `About 5 minutes · ${next.lesson!.items.length} new phrases`}</p>
          </>
        ) : (
          <h2>Path complete! 🎉</h2>
        )}
        <div className="btn-row">
          {next && (
            <button className="primary big-btn" onClick={() => navigate(`/lesson/${next.id}`)}>
              {nextIdx === 0 ? 'Start' : 'Continue'} ▶
            </button>
          )}
          {due > 0 && <button onClick={() => navigate('/lesson/review')}>🔁 Review {due} phrases</button>}
        </div>
      </section>

      {PATH.map((unit, ui) => {
        const steps = PATH_STEPS.filter((st) => st.unit === unit);
        const finished = steps.every((st) => done[st.id]);
        const firstIdx = PATH_STEPS.indexOf(steps[0]);
        const unitLocked = nextIdx >= 0 && firstIdx > nextIdx;
        return (
          <section key={unit.id} className={`unit${unitLocked ? ' locked' : ''}${finished ? ' finished' : ''}`}>
            <div className="unit-head">
              <span className="unit-emoji">{unit.emoji}</span>
              <div>
                <div className="eyebrow">Unit {ui + 1}</div>
                <h2>{unit.title}</h2>
                <div className="muted-text small-text">{unit.goal}</div>
              </div>
            </div>
            <ol className="steps">
              {steps.map((st) => {
                const idx = PATH_STEPS.indexOf(st);
                const isDone = !!done[st.id];
                const isNext = idx === nextIdx;
                const locked = !isDone && !isNext;
                return (
                  <li key={st.id}>
                    <button className={`step${isDone ? ' done' : ''}${isNext ? ' next' : ''}${locked ? ' locked' : ''}`} onClick={() => open(st.id, locked)}>
                      <span className="step-dot">{isDone ? '✓' : st.test ? '🏁' : locked ? '🔒' : '▶'}</span>
                      <span className="step-title">{st.test ? 'Unit test' : st.lesson!.title}</span>
                      {isDone && <span className="step-acc">{done[st.id].acc}%</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
            {finished && unit.scenario && (
              <div className="btn-row unit-extra">
                <button className="small" onClick={() => navigate(`/roleplay/${unit.scenario}`)}>
                  🎭 Try it with AI
                </button>
                <button className="small ghost" onClick={() => navigate(`/scenario/${unit.scenario}`)}>
                  More phrases
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
