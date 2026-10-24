import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../../app/router'
import { SkillList } from '../../components/SkillList'
import { SkillRadar } from '../../components/SkillRadar'
import {
  answerPlacement,
  finalizePlacement,
  halfGameForEstimate,
  PLACEMENT_ITEMS,
  SELF_ASSESSMENT,
  startPlacement,
  type PlacementState,
} from '../../core/placement'
import { overallRating, SKILL_LABEL, SKILLS, STAGES, stageForRating, type Rating, type Skill } from '../../core/rating'
import { updateProfile } from '../../core/store'
import { endgameById } from '../../data/endgames'
import { loadPuzzles, pickPuzzle, puzzleToExercise, type Puzzle } from '../../data/puzzles'
import { HalfGamePlayer } from '../endgame/HalfGamePlayer'
import { PuzzlePlayer } from '../puzzle/PuzzlePlayer'
import './placement.css'

type View =
  | { kind: 'intro' }
  | { kind: 'running'; state: PlacementState; index: number; puzzle: Puzzle | null; answered: boolean; used: string[] }
  | { kind: 'result'; ratings: Record<Skill, Rating>; state: PlacementState }

export function PlacementPage() {
  const [view, setView] = useState<View>({ kind: 'intro' })
  const [all, setAll] = useState<Puzzle[] | null>(null)

  useEffect(() => {
    void loadPuzzles().then(setAll)
  }, [])

  function choosePuzzle(state: PlacementState, index: number, used: string[]): Puzzle | null {
    const item = PLACEMENT_ITEMS[index]
    if (!all || item.kind !== 'puzzle') return null
    const skill = item.themes ? undefined : item.skill
    return pickPuzzle(all, {
      skill: skill === 'strategy' ? undefined : skill,
      themes: item.themes,
      rating: state.estimate,
      spread: 100,
      exclude: used,
      maxUserMoves: state.estimate < 1000 ? 2 : state.estimate < 1500 ? 3 : 4,
    })
  }

  function start(selfRating: number) {
    const state = startPlacement(selfRating)
    setView({ kind: 'running', state, index: 0, puzzle: choosePuzzle(state, 0, []), answered: false, used: [] })
  }

  function beginnerPath() {
    updateProfile((p) => {
      for (const s of SKILLS) p.ratings[s] = { r: 300, rd: 250 }
      p.placementDone = true
      p.ratingHistory.push({ t: Date.now(), r: 300 })
    })
    navigate('/curriculum')
  }

  function answer(success: boolean, rating: number, skill: Skill, timeMs: number) {
    if (view.kind !== 'running' || view.answered) return
    const state = answerPlacement(view.state, { success, rating, skill, timeMs })
    setView({ ...view, state, answered: true })
  }

  function next() {
    if (view.kind !== 'running') return
    const index = view.index + 1
    if (index >= PLACEMENT_ITEMS.length) {
      const ratings = finalizePlacement(view.state)
      updateProfile((p) => {
        p.ratings = ratings
        p.placementDone = true
        p.ratingHistory.push({ t: Date.now(), r: overallRating(ratings) })
      })
      setView({ kind: 'result', ratings, state: view.state })
      return
    }
    const used = view.puzzle ? [...view.used, view.puzzle.id] : view.used
    setView({
      kind: 'running',
      state: view.state,
      index,
      puzzle: choosePuzzle(view.state, index, used),
      answered: false,
      used,
    })
  }

  if (view.kind === 'intro') {
    return (
      <div className="placement-intro">
        <h1>Seviye testi</h1>
        <p className="muted">
          12 pozisyon, yaklaşık 8–10 dakika. Her pozisyonda en iyi hamleyi tahtada oyna. Doğru cevapladıkça sorular
          zorlaşır, yanlışta kolaylaşır. İpucu yok, her pozisyonda tek şansın var — tahmin etmektense düşün.
        </p>
        <h3>Kendini nasıl tanımlarsın?</h3>
        <p className="muted small">Bu sadece başlangıç noktası; test seni doğru seviyeye taşıyacak.</p>
        <div className="self-grid">
          {SELF_ASSESSMENT.map((s) => (
            <button key={s.label} className="self-card" onClick={() => start(s.rating)} disabled={!all}>
              <b>{s.label}</b>
              <span className="muted small">{s.hint}</span>
            </button>
          ))}
        </div>
        <button className="btn link-btn" onClick={beginnerPath}>
          Satranç kurallarını henüz bilmiyorum → Temellerden başla
        </button>
        {!all && <p className="muted small">Pozisyonlar yükleniyor…</p>}
      </div>
    )
  }

  if (view.kind === 'result') return <PlacementResult ratings={view.ratings} state={view.state} />

  const item = PLACEMENT_ITEMS[view.index]
  const progress = (
    <div className="placement-progress">
      <div className="muted small">
        Pozisyon {view.index + 1} / {PLACEMENT_ITEMS.length}
      </div>
      <div className="progress">
        <div style={{ width: `${(view.index / PLACEMENT_ITEMS.length) * 100}%` }} />
      </div>
    </div>
  )
  const nextButton = (
    <button className="btn primary" onClick={next} autoFocus>
      {view.index + 1 === PLACEMENT_ITEMS.length ? 'Sonuçları gör' : 'Sonraki pozisyon →'}
    </button>
  )

  if (item.kind === 'halfgame') {
    const game = endgameById(halfGameForEstimate(view.state.estimate))!
    return (
      <HalfGamePlayer
        key={game.id}
        game={game}
        mode="test"
        header={progress}
        onComplete={(o) => answer(o.success, game.rating, 'endgame', 60000)}
      >
        {nextButton}
      </HalfGamePlayer>
    )
  }

  if (!view.puzzle) {
    return (
      <div>
        {progress}
        <p className="muted">Bu seviyede uygun pozisyon bulunamadı.</p>
        <button className="btn" onClick={next}>
          Atla
        </button>
      </div>
    )
  }

  return (
    <TestPuzzle
      puzzle={view.puzzle}
      header={
        <>
          {progress}
          <span className="chip">{SKILL_LABEL[item.skill]}</span>
        </>
      }
      onDone={(success, timeMs) => answer(success, view.puzzle!.rating, item.skill, timeMs)}
    >
      {nextButton}
    </TestPuzzle>
  )
}

function TestPuzzle({
  puzzle,
  header,
  onDone,
  children,
}: {
  puzzle: Puzzle
  header: React.ReactNode
  onDone: (success: boolean, timeMs: number) => void
  children: React.ReactNode
}) {
  const exercise = useMemo(() => puzzleToExercise(puzzle), [puzzle])
  return (
    <PuzzlePlayer
      key={exercise.id}
      exercise={exercise}
      mode="test"
      header={header}
      onComplete={(o) => onDone(o.success, o.timeMs)}
    >
      {children}
    </PuzzlePlayer>
  )
}

function PlacementResult({ ratings, state }: { ratings: Record<Skill, Rating>; state: PlacementState }) {
  const overall = overallRating(ratings)
  const stage = STAGES[stageForRating(overall)]
  const sorted = [...SKILLS].sort((a, b) => ratings[b].r - ratings[a].r)
  const correct = state.answers.filter((a) => a.success).length
  return (
    <div className="placement-result">
      <div className="result-hero card">
        <div>
          <div className="muted small">Tahmini seviyen</div>
          <div className="hero-number">{overall}</div>
          <div className="chip">
            Aşama {stage.id}: {stage.name}
          </div>
          <p className="muted small">
            {state.answers.length} pozisyonun {correct} tanesini çözdün.
          </p>
        </div>
        <div className="result-actions">
          <button className="btn primary" onClick={() => navigate('/curriculum')}>
            Müfredata başla →
          </button>
          <button className="btn" onClick={() => navigate('/')}>
            Günlük plana git
          </button>
        </div>
      </div>
      <div className="result-grid">
        <div className="card">
          <h3>Beceri profili</h3>
          <div className="radar-wrap">
            <SkillRadar ratings={ratings} />
            <SkillList ratings={ratings} />
          </div>
        </div>
        <div className="card">
          <h3>Değerlendirme</h3>
          <p>
            <b>En güçlü alanın:</b> {SKILL_LABEL[sorted[0]]}
            <br />
            <b>Gelişime en açık alan:</b> {SKILL_LABEL[sorted.at(-1)!]}
          </p>
          <p className="muted small">
            Günlük antrenman planın zayıf alanlarına daha fazla yer ayıracak. Puanların her çözdüğün egzersizle
            güncellenir; testi istediğin zaman tekrarlayabilirsin.
          </p>
          <ol className="answer-list">
            {state.answers.map((a, i) => (
              <li key={i} className={a.success ? 'ok' : 'no'}>
                <span>{a.success ? '✓' : '✗'}</span> {SKILL_LABEL[a.skill]}
                <span className="muted small"> · {a.rating}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
