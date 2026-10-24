import { EndgamePlayPage, EndgamesPage } from '../modules/endgame/EndgamesPage'
import { GuessPage } from '../modules/guess/GuessPage'
import { HomePage } from '../modules/home/HomePage'
import { CurriculumPage } from '../modules/lesson/CurriculumPage'
import { StageExamPage } from '../modules/lesson/StageExamPage'
import { UnitPage } from '../modules/lesson/UnitPage'
import { CoursePage, OpeningReviewPage, OpeningsPage } from '../modules/opening/OpeningsPage'
import { PlacementPage } from '../modules/placement/PlacementPage'
import { ImportPage } from '../modules/play/ImportPage'
import { PlayPage } from '../modules/play/PlayPage'
import { PuzzlesPage } from '../modules/puzzle/PuzzlesPage'
import { DailyTaskPage, ReviewPage } from '../modules/review/ReviewPage'
import { RushPage } from '../modules/rush/RushPage'
import { SandboxPage } from '../modules/sandbox/SandboxPage'
import { SettingsPage } from '../modules/settings/SettingsPage'
import { VisualPage } from '../modules/visual/VisualPage'
import { useEffect } from 'react'
import { useProfile } from '../core/store'
import { useRoute } from './router'
import './app.css'

interface NavItem {
  path: string
  label: string
  icon: string
  /** Bu önekle başlayan rotalarda da menü öğesi etkin görünür */
  match?: string[]
}

const NAV: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { path: '/', label: 'Ana sayfa', icon: '⌂', match: ['/daily'] },
      { path: '/placement', label: 'Seviye testi', icon: '◎' },
      { path: '/curriculum', label: 'Müfredat', icon: '☰', match: ['/unit', '/stage-exam'] },
      { path: '/review', label: 'Tekrar', icon: '↻' },
    ],
  },
  {
    title: 'Antrenman',
    items: [
      { path: '/puzzles', label: 'Bulmacalar', icon: '♞' },
      { path: '/openings', label: 'Açılışlar', icon: '♗', match: ['/opening'] },
      { path: '/endgames', label: 'Oyunsonları', icon: '♔', match: ['/endgame'] },
      { path: '/rush', label: 'Hız taktiği', icon: '⚡' },
      { path: '/visual', label: 'Görselleştirme', icon: '◐' },
      { path: '/guess', label: 'Hamle tahmini', icon: '★' },
    ],
  },
  {
    title: 'Oyna ve analiz et',
    items: [
      { path: '/play', label: 'Motora karşı', icon: '⚔' },
      { path: '/import', label: 'Oyun analizi', icon: '⌕' },
      { path: '/sandbox', label: 'Serbest tahta', icon: '▦' },
      { path: '/settings', label: 'Ayarlar', icon: '⚙' },
    ],
  },
]

function pageFor(route: string) {
  const [, section, param] = route.split('/')
  switch (`/${section ?? ''}`) {
    case '/placement':
      return <PlacementPage />
    case '/curriculum':
      return <CurriculumPage />
    case '/unit':
      return <UnitPage id={param} />
    case '/stage-exam':
      return <StageExamPage key={param} stage={Number(param)} />
    case '/review':
      return <ReviewPage />
    case '/daily':
      return <DailyTaskPage key={param} task={param} />
    case '/puzzles':
      return <PuzzlesPage />
    case '/openings':
      return <OpeningsPage />
    case '/opening':
      return <CoursePage key={param} id={param} />
    case '/opening-review':
      return <OpeningReviewPage />
    case '/endgames':
      return <EndgamesPage />
    case '/endgame':
      return <EndgamePlayPage id={param} />
    case '/rush':
      return <RushPage />
    case '/visual':
      return <VisualPage />
    case '/guess':
      return <GuessPage />
    case '/play':
      return <PlayPage />
    case '/import':
      return <ImportPage />
    case '/sandbox':
      return <SandboxPage />
    case '/settings':
      return <SettingsPage />
    default:
      return <HomePage />
  }
}

const isActive = (route: string, item: NavItem) =>
  route === item.path || (item.match ?? []).some((m) => route === m || route.startsWith(`${m}/`) || route.startsWith(`${m}-`))

export default function App() {
  const route = useRoute()
  const board = useProfile().settings.boardTheme
  useEffect(() => {
    document.documentElement.dataset.board = board
  }, [board])
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#/">
          <span className="brand-mark">♚</span>
          <span>Satranç Öğretici</span>
        </a>
        <nav>
          {NAV.map((group, gi) => (
            <div key={gi} className="nav-group">
              {group.title && <div className="nav-title">{group.title}</div>}
              {group.items.map((item) => (
                <a key={item.path} href={`#${item.path}`} className={`nav-item${isActive(route, item) ? ' active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      {/* key: rota değişince sayfa durumu sıfırlansın */}
      <main className="main" key={route}>
        {pageFor(route)}
      </main>
    </div>
  )
}
