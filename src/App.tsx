import { useRoute } from './components/common';
import Practice from './pages/Home';
import Path from './pages/Path';
import Lesson from './pages/Lesson';
import ScenarioPage from './pages/ScenarioPage';
import Review from './pages/Review';
import Numbers from './pages/Numbers';
import Roleplay from './pages/Roleplay';
import Capture from './pages/Capture';
import SettingsPage from './pages/Settings';
import SmallTalk from './pages/SmallTalk';
import { useAppState, dueQueue } from './lib/store';

const TABS = [
  { path: 'home', icon: '🗺️', label: 'Learn' },
  { path: 'review', icon: '🃏', label: 'Review' },
  { path: 'practice', icon: '🎯', label: 'Practice' },
  { path: 'settings', icon: '⚙️', label: 'Settings' },
];

/** Which tab is highlighted for a given page */
const TAB_OF: Record<string, string> = { scenario: 'practice', smalltalk: 'practice', numbers: 'practice', capture: 'practice', roleplay: 'practice' };

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
    case 'practice':
      content = <Practice />;
      break;
    case 'lesson':
      content = <Lesson key={arg} id={arg} />;
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
      content = <Path />;
  }

  const due = dueQueue().length;
  const hideNav = page === 'roleplay' || page === 'lesson';
  const activeTab = TAB_OF[page] ?? (TABS.some((t) => t.path === page) ? page : 'home');

  return (
    <div className={`app${hideNav ? ' no-nav' : ''}`}>
      <main>{content}</main>
      {!hideNav && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <a key={t.path} href={`#/${t.path}`} className={activeTab === t.path ? 'active' : ''}>
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
