import { useEffect, useMemo, useState } from 'react'
import { getProfile, markDailyTask, recordResult, updateProfile, useProfile } from '../../core/store'
import { loadPuzzles, pickPuzzle, puzzleSkills, puzzleToExercise, type Puzzle } from '../../data/puzzles'
import { PuzzlePlayer } from '../puzzle/PuzzlePlayer'
import './rush.css'

const MODES = [
  { id: '3m', label: '3 dakika', seconds: 180 },
  { id: '5m', label: '5 dakika', seconds: 300 },
  { id: 'survival', label: 'Hayatta kal', seconds: 0 },
] as const
type ModeId = (typeof MODES)[number]['id']
const MAX_STRIKES = 3

export function RushPage() {
  const profile = useProfile()
  const [mode, setMode] = useState<ModeId | null>(null)
  const [run, setRun] = useState(0)
  if (!mode) {
    return (
      <div className="rush-menu">
        <h1>Hız taktiği</h1>
        <p className="muted">
          Bulmacalar kolaydan başlar ve her doğru cevapta zorlaşır. {MAX_STRIKES} hatada oyun biter. Örüntü tanıma hızını
          geliştirmenin en iyi yolu.
        </p>
        <div className="rush-modes">
          {MODES.map((m) => (
            <button key={m.id} className="self-card" onClick={() => setMode(m.id)}>
              <b>{m.label}</b>
              <span className="muted small">En iyi: {profile.stats.rushBest[m.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }
  return <RushRun key={run} mode={mode} onAgain={() => setRun((r) => r + 1)} onMenu={() => setMode(null)} />
}

function RushRun({ mode, onAgain, onMenu }: { mode: ModeId; onAgain: () => void; onMenu: () => void }) {
  const config = MODES.find((m) => m.id === mode)!
  const [all, setAll] = useState<Puzzle[] | null>(null)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [score, setScore] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [left, setLeft] = useState<number>(config.seconds)
  const [over, setOver] = useState(false)
  const [used] = useState<string[]>([])
  const [base] = useState(() => Math.max(400, getProfile().ratings.tactics.r - 500))

  const pick = (ps: Puzzle[], solved: number) => {
    const p = pickPuzzle(ps, { rating: base + solved * 60, spread: 80, exclude: used, maxUserMoves: 3 })
    if (p) used.push(p.id)
    return p
  }

  useEffect(() => {
    void loadPuzzles().then((ps) => {
      setAll(ps)
      setPuzzle(pick(ps, 0))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!config.seconds || over || !all) return
    const t = window.setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [config.seconds, over, all])

  useEffect(() => {
    if (config.seconds && left <= 0 && !over) end(score)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  function end(final: number) {
    setOver(true)
    markDailyTask('rush')
    updateProfile((p) => {
      p.stats.rushBest[mode] = Math.max(p.stats.rushBest[mode] ?? 0, final)
    })
  }

  const exercise = useMemo(() => (puzzle ? puzzleToExercise(puzzle) : null), [puzzle])

  function complete(success: boolean) {
    if (!all || !puzzle) return
    recordResult({ id: puzzle.id, skills: puzzleSkills(puzzle), rating: puzzle.rating, score: success ? 1 : 0 })
    const s = score + (success ? 1 : 0)
    const k = strikes + (success ? 0 : 1)
    setScore(s)
    setStrikes(k)
    if (k >= MAX_STRIKES) {
      end(s)
      return
    }
    window.setTimeout(() => setPuzzle(pick(all, s)), success ? 350 : 1200)
  }

  const best = getProfile().stats.rushBest[mode] ?? 0
  const header = (
    <div className="rush-bar">
      <div>
        <span className="muted small">Skor</span>
        <b>{score}</b>
      </div>
      {config.seconds > 0 && (
        <div>
          <span className="muted small">Süre</span>
          <b className={left <= 15 ? 'down' : ''}>
            {Math.floor(Math.max(0, left) / 60)}:{String(Math.max(0, left) % 60).padStart(2, '0')}
          </b>
        </div>
      )}
      <div>
        <span className="muted small">Hata</span>
        <b>
          {'✗'.repeat(strikes)}
          <span className="muted">{'○'.repeat(MAX_STRIKES - strikes)}</span>
        </b>
      </div>
    </div>
  )

  if (over) {
    return (
      <div className="rush-menu">
        <h1>Süre doldu!</h1>
        <div className="hero-number">{score}</div>
        <p className="muted">{score > best ? 'Yeni rekor! 🎉' : `En iyi skorun: ${Math.max(best, score)}`}</p>
        <div className="puzzle-actions">
          <button className="btn primary" onClick={onAgain}>
            Tekrar oyna
          </button>
          <button className="btn" onClick={onMenu}>
            Mod seç
          </button>
        </div>
      </div>
    )
  }
  if (!exercise) return <p className="muted">Yükleniyor…</p>
  return (
    <PuzzlePlayer key={exercise.id} exercise={exercise} mode="test" onComplete={(o) => complete(o.success)} header={header} />
  )
}
