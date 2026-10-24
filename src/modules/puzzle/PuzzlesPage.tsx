import { useEffect, useMemo, useState } from 'react'
import { SKILL_LABEL, type Skill } from '../../core/rating'
import { addMistake, getProfile, recordResult, useProfile } from '../../core/store'
import { loadPuzzles, outcomeScore, pickPuzzle, puzzleSkills, puzzleToExercise, type Puzzle } from '../../data/puzzles'
import { themeName } from '../../data/themes'
import { PuzzlePlayer, type ExerciseOutcome } from './PuzzlePlayer'

const PUZZLE_SKILLS: Skill[] = ['tactics', 'mates', 'calculation', 'endgame', 'opening']
const THEME_FILTERS = ['fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck', 'deflection', 'attraction',
  'hangingPiece', 'sacrifice', 'trappedPiece', 'xRayAttack', 'interference', 'clearance', 'capturingDefender',
  'intermezzo', 'quietMove', 'defensiveMove', 'zugzwang', 'promotion', 'backRankMate', 'smotheredMate',
  'anastasiaMate', 'arabianMate', 'bodenMate', 'hookMate', 'mateIn1', 'mateIn2', 'mateIn3', 'pawnEndgame',
  'rookEndgame', 'queenEndgame', 'bishopEndgame', 'knightEndgame']

type Filter = { kind: 'mixed' } | { kind: 'skill'; skill: Skill } | { kind: 'theme'; theme: string }

/** Karışık modda zayıf beceriye daha fazla ağırlık ver */
function chooseSkill(): Skill {
  const { ratings } = getProfile()
  const weights = PUZZLE_SKILLS.map((s) => {
    const avg = PUZZLE_SKILLS.reduce((a, x) => a + ratings[x].r, 0) / PUZZLE_SKILLS.length
    return Math.max(0.5, 1 + (avg - ratings[s].r) / 300)
  })
  let r = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) <= 0) return PUZZLE_SKILLS[i]
  return 'tactics'
}

function nextPuzzle(all: Puzzle[], filter: Filter): Puzzle | null {
  const p = getProfile()
  if (filter.kind === 'theme') {
    const r = p.ratings.tactics.r
    return pickPuzzle(all, { themes: [filter.theme], rating: r, exclude: p.seen })
  }
  const skill = filter.kind === 'skill' ? filter.skill : chooseSkill()
  return pickPuzzle(all, { skill, rating: p.ratings[skill].r, exclude: p.seen })
}

export function PuzzlesPage() {
  const profile = useProfile()
  const [all, setAll] = useState<Puzzle[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>({ kind: 'mixed' })
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [result, setResult] = useState<{ o: ExerciseOutcome; deltas: Partial<Record<Skill, number>> } | null>(null)
  const [session, setSession] = useState({ solved: 0, total: 0 })

  useEffect(() => {
    loadPuzzles()
      .then((ps) => {
        setAll(ps)
        setPuzzle(nextPuzzle(ps, { kind: 'mixed' }))
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  const exercise = useMemo(() => (puzzle ? puzzleToExercise(puzzle) : null), [puzzle])

  function next(f = filter) {
    if (!all) return
    setResult(null)
    setPuzzle(nextPuzzle(all, f))
  }

  function changeFilter(value: string) {
    const f: Filter =
      value === 'mixed'
        ? { kind: 'mixed' }
        : value.startsWith('s:')
          ? { kind: 'skill', skill: value.slice(2) as Skill }
          : { kind: 'theme', theme: value.slice(2) }
    setFilter(f)
    next(f)
  }

  function complete(o: ExerciseOutcome) {
    if (!puzzle) return
    const deltas = recordResult({
      id: puzzle.id,
      skills: puzzleSkills(puzzle),
      rating: puzzle.rating,
      score: outcomeScore(o),
    })
    if (!o.success) addMistake({ id: `p:${puzzle.id}`, kind: 'puzzle', puzzleId: puzzle.id })
    setSession((s) => ({ solved: s.solved + (o.success ? 1 : 0), total: s.total + 1 }))
    setResult({ o, deltas })
  }

  if (error) return <p className="msg bad">{error}</p>
  if (!all) return <p className="muted">Bulmacalar yükleniyor…</p>

  const filterValue =
    filter.kind === 'mixed' ? 'mixed' : filter.kind === 'skill' ? `s:${filter.skill}` : `t:${filter.theme}`
  const skillShown = puzzle?.skill ?? 'tactics'

  return (
    <div>
      <div className="page-head">
        <h1>Bulmacalar</h1>
        <select className="select" value={filterValue} onChange={(e) => changeFilter(e.target.value)}>
          <option value="mixed">Karışık (zayıf alanlara ağırlık)</option>
          <optgroup label="Beceri">
            {PUZZLE_SKILLS.map((s) => (
              <option key={s} value={`s:${s}`}>
                {SKILL_LABEL[s]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Tema">
            {THEME_FILTERS.map((t) => (
              <option key={t} value={`t:${t}`}>
                {themeName(t)}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      {!exercise || !puzzle ? (
        <p className="muted">Bu filtrede uygun bulmaca kalmadı.</p>
      ) : (
        <PuzzlePlayer
          key={exercise.id}
          exercise={exercise}
          onComplete={complete}
          header={
            <div className="puzzle-meta">
              <span className="chip">{SKILL_LABEL[skillShown]}</span>
              <span className="muted">
                Puanın: <b>{profile.ratings[skillShown].r}</b>
              </span>
              <span className="muted">
                Oturum: {session.solved}/{session.total}
              </span>
              <a
                className="muted small puzzle-id"
                href={`https://lichess.org/training/${puzzle.id}`}
                target="_blank"
                rel="noreferrer"
                title="Lichess'te aç"
              >
                #{puzzle.id}
              </a>
            </div>
          }
        >
          {result && (
            <div className="result-box">
              <div className={`result-title ${result.o.success ? 'good' : 'bad'}`}>
                {result.o.success ? 'Çözüldü' : 'Çözülemedi — hata defterine eklendi'}
              </div>
              <div className="muted small">
                Bulmaca puanı {puzzle.rating} ·{' '}
                {Object.entries(result.deltas).map(([s, d]) => (
                  <span key={s} className={d! >= 0 ? 'up' : 'down'}>
                    {SKILL_LABEL[s as Skill]} {d! >= 0 ? '+' : ''}
                    {d}{' '}
                  </span>
                ))}
              </div>
              <div className="muted small">Temalar: {puzzle.themes.map(themeName).join(', ')}</div>
              <button className="btn primary" onClick={() => next()} autoFocus>
                Sonraki bulmaca →
              </button>
            </div>
          )}
        </PuzzlePlayer>
      )}
    </div>
  )
}
