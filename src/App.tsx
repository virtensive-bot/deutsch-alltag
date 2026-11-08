import { useRoute } from './components/common';
import Home from './pages/Home';
import ScenarioPage from './pages/ScenarioPage';
import Review from './pages/Review';
import Numbers from './pages/Numbers';
import Roleplay from './pages/Roleplay';
import Capture from './pages/Capture';
import SettingsPage from './pages/Settings';
import SmallTalk from './pages/SmallTalk';
import { useAppState, dueQueue } from './lib/store';

const TABS = [
  { path: 'home', icon: '🏠', label: 'Home' },
  { path: 'review', icon: '🃏', label: 'Review' },
  { path: 'numbers', icon: '🔢', label: 'Numbers' },
  { path: 'capture', icon: '📝', label: 'Capture' },
  { path: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function App() {
  const route = useRoute();
  useAppState(); // re-render on state changes (badge counts)
  const [page, arg] = route;

  let content;
  switch (page) {
    case 'scenario':
      content = <ScenarioPage id={arg} />;
      break;
    case 'review':
      content = <Review scope={arg} />;
      break;
    case 'numbers':
      content = <Numbers />;
      break;
    case 'roleplay':
      content = <Roleplay id={arg} />;
      break;
    case 'capture':
      content = <Capture />;
      break;
    case 'smalltalk':
      content = <SmallTalk sub={arg} />;
      break;
    case 'settings':
      content = <SettingsPage />;
      break;
    default:
      content = <Home />;
  }

  const due = dueQueue().length;
  const hideNav = page === 'roleplay';

  return (
    <div className={`app${hideNav ? ' no-nav' : ''}`}>
      <main>{content}</main>
      {!hideNav && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <a key={t.path} href={`#/${t.path}`} className={page === t.path || (t.path === 'home' && !TABS.some((x) => x.path === page) && page !== 'scenario' && page !== 'smalltalk') ? 'active' : ''}>
              <span className="tab-icon">
                {t.icon}
                {t.path === 'review' && due > 0 && <span className="badge">{due > 99 ? '99+' : due}</span>}
              </span>
              <span className="tab-label">{t.label}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
