import { Chess, type Square } from 'chess.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Arrow } from 'react-chessboard'
import { ChessBoard, type Highlight } from '../../board/ChessBoard'
import { parseUci, toUci, type MoveInput } from '../../board/moves'
import { RichText } from '../../components/RichText'
import { SKILL_LABEL, type Skill } from '../../core/rating'
import { playMoveSound, playSound } from '../../core/sound'
import { minStarMoves, pieceTargets, starsFen, type StarPiece } from '../../core/stars'
import { addMistake, getProfile, recordResult } from '../../core/store'
import type { LessonStep } from '../../data/curriculum/types'
import { ARROW_COLOR, toArrows } from '../../board/arrows'
import { lastMoveOf, positionFen } from '../../data/curriculum/resolve'
import { loadPuzzles, outcomeScore, pickPuzzle, puzzleSkills, puzzleToExercise, type Puzzle } from '../../data/puzzles'
import { getEngine } from '../../engine/engine'
import { lineValue } from '../../engine/score'
import { PuzzlePlayer, type ExerciseOutcome } from '../puzzle/PuzzlePlayer'
import '../puzzle/puzzle.css'


interface StepProps<T extends LessonStep['type']> {
  step: Extract<LessonStep, { type: T }>
  onDone: (success: boolean) => void
  /** Bulmaca puanı hedefi */
  targetRating: (skill: Skill) => number
  footer: React.ReactNode
}

/** Tahta + yan panel düzeni */
function Layout({ board, children }: { board: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="puzzle">
      {board}
      <aside className="puzzle-side card">{children}</aside>
    </div>
  )
}

export function TextStep({ step, footer }: StepProps<'text'>) {
  const fen = positionFen(step)
  const marks = Object.fromEntries((step.marks ?? []).map((m) => [m, 'focus' as Highlight]))
  return (
    <Layout
      board={
        <ChessBoard
          fen={fen}
          movable="none"
          orientation={step.orientation}
          arrows={toArrows(step.arrows)}
          highlights={marks}
          lastMove={lastMoveOf(step)}
        />
      }
    >
      {step.title && <h3>{step.title}</h3>}
      <p className="lesson-text">
        <RichText text={step.text} />
      </p>
      {footer}
    </Layout>
  )
}

export function MoveStep({ step, onDone, footer }: StepProps<'move'>) {
  const exercise = useMemo(
    () => ({
      id: `${positionFen(step)}|${step.solution.join(',')}`,
      fen: positionFen(step),
      setup: step.setup,
      solution: step.solution,
      acceptAnyMate: step.acceptAnyMate,
      wrongFeedback: step.wrongFeedback,
      comments: step.comments,
      prompt: step.text,
    }),
    [step],
  )
  return (
    <PuzzlePlayer key={exercise.id} exercise={exercise} onComplete={(o) => onDone(o.success)} showRefutation={false}>
      {footer}
    </PuzzlePlayer>
  )
}

export function StarsStep({ step, onDone, footer }: StepProps<'stars'>) {
  const [at, setAt] = useState(step.start)
  const [left, setLeft] = useState(step.stars.filter((s) => s !== step.start))
  const [moves, setMoves] = useState(0)
  const [last, setLast] = useState<{ from: string; to: string } | null>(null)
  const done = left.length === 0
  const best = useMemo(() => minStarMoves(step.piece, step.start, step.stars), [step])
  const piece = step.piece as StarPiece

  function onMove(m: MoveInput) {
    if (done) return false
    playSound('move')
    const remaining = left.filter((s) => s !== m.to)
    if (remaining.length < left.length) playSound('notify')
    setAt(m.to)
    setLast({ from: m.from, to: m.to })
    setMoves((n) => n + 1)
    setLeft(remaining)
    if (!remaining.length) {
      playSound('success')
      onDone(true)
    }
    return true
  }

  function reset() {
    setAt(step.start)
    setLeft(step.stars.filter((s) => s !== step.start))
    setMoves(0)
    setLast(null)
  }

  return (
    <Layout
      board={
        <ChessBoard
          fen={starsFen(piece, at)}
          onMove={onMove}
          movable={done ? 'none' : 'w'}
          legalTargets={(sq) => (sq === at ? (pieceTargets(piece, sq) as Square[]) : [])}
          highlights={Object.fromEntries(left.map((s) => [s, 'star' as Highlight]))}
          lastMove={last}
        />
      }
    >
      <p className="lesson-text">
        <RichText text={step.text} />
      </p>
      <div className="goal">
        <b>Hamle:</b> {moves}
        <span className="moves-left">En iyi: {best}</span>
      </div>
      {done && (
        <p className={`msg ${moves <= step.par ? 'good' : 'info'}`}>
          {moves <= best ? 'Mükemmel — en kısa yol!' : moves <= step.par ? 'Harika!' : `Tamamlandı. ${best} hamlede yapmayı dene.`}
        </p>
      )}
      <div className="puzzle-actions">
        <button className="btn" onClick={reset}>
          ⟲ Baştan
        </button>
      </div>
      {done && footer}
    </Layout>
  )
}

const ALL_SQUARES = Array.from({ length: 64 }, (_, i) => `${'abcdefgh'[i % 8]}${Math.floor(i / 8) + 1}`)
const randomSquare = (except?: string) => {
  let t = except
  while (t === except) t = ALL_SQUARES[Math.floor(Math.random() * 64)]
  return t!
}

export function SquaresStep({ step, onDone, footer }: StepProps<'squares'>) {
  const [target, setTarget] = useState(randomSquare)
  const [score, setScore] = useState({ ok: 0, total: 0 })
  const [flash, setFlash] = useState<Partial<Record<string, Highlight>>>({})
  const done = score.total >= step.count

  function click(sq: string) {
    if (done) return
    const ok = sq === target
    playSound(ok ? 'notify' : 'error')
    setFlash({ [sq]: ok ? 'good' : 'bad', ...(ok ? {} : { [target]: 'focus' }) })
    const next = { ok: score.ok + (ok ? 1 : 0), total: score.total + 1 }
    setScore(next)
    setTarget(randomSquare(target))
    if (next.total >= step.count) onDone(next.ok / next.total >= 0.7)
  }

  return (
    <Layout
      board={
        <div className="squares-board">
          <ChessBoard fen="8/8/8/8/8/8/8/8 w - - 0 1" movable="none" highlights={flash} />
          <div className="squares-grid">
            {ALL_SQUARES.map((sq) => (
              <button
                key={sq}
                aria-label={sq}
                style={{ gridColumn: sq.charCodeAt(0) - 96, gridRow: 9 - Number(sq[1]) }}
                onClick={() => click(sq)}
              />
            ))}
          </div>
        </div>
      }
    >
      <p className="lesson-text">
        <RichText text={step.text} />
      </p>
      {!done ? <div className="big-target">{target}</div> : <p className="msg good">Bitti!</p>}
      <div className="goal">
        Doğru: {score.ok} / {score.total}
        <span className="moves-left">
          {Math.min(score.total, step.count)}/{step.count}
        </span>
      </div>
      {done && footer}
    </Layout>
  )
}

export function PlanStep({ step, onDone, footer, targetRating }: StepProps<'plan'>) {
  const startFen = positionFen(step)
  const [fen, setFen] = useState(startFen)
  const [last, setLast] = useState<{ from: string; to: string } | null>(null)
  const [state, setState] = useState<'idle' | 'thinking' | 'good' | 'bad'>('idle')
  const [detail, setDetail] = useState('')
  const [arrows, setArrows] = useState<Arrow[]>([])
  const reported = useRef(false)

  async function evaluate(uci: string, san: string) {
    setState('thinking')
    const engine = getEngine()
    const before = await engine.analyse(startFen, { movetime: 1200, depth: 18 })
    const bestVal = before.lines[0] ? lineValue(before.lines[0]) : 0
    let loss = 0
    if (before.bestMove !== uci) {
      const c = new Chess(startFen)
      c.move(parseUci(uci))
      const after = await engine.analyse(c.fen(), { movetime: 900, depth: 16 })
      const userVal = after.lines[0] ? -lineValue(after.lines[0]) : 0
      loss = Math.max(0, bestVal - userVal)
    }
    const ok = step.good.includes(uci) || loss <= step.tolerance
    const bestSan = before.bestMove ? new Chess(startFen).move(parseUci(before.bestMove)).san : '?'
    setState(ok ? 'good' : 'bad')
    setDetail(
      ok
        ? `${san} iyi bir hamle.${before.bestMove !== uci ? ` Motorun ilk tercihi: ${bestSan}.` : ''}`
        : `${san} pozisyonu zayıflatıyor (yaklaşık ${(loss / 100).toFixed(1)} piyon). Motorun tercihi: ${bestSan}.`,
    )
    if (before.bestMove) {
      const b = parseUci(before.bestMove)
      setArrows([{ startSquare: b.from, endSquare: b.to, color: ARROW_COLOR.green }])
    }
    playSound(ok ? 'success' : 'error')
    if (!reported.current) {
      reported.current = true
      recordResult({ id: `plan:${startFen}`, skills: ['strategy'], rating: targetRating('strategy'), score: ok ? 1 : 0 })
      onDone(ok)
    }
  }

  function onMove(m: MoveInput) {
    if (state !== 'idle') return false
    const c = new Chess(startFen)
    let mv
    try {
      mv = c.move(m)
    } catch {
      return false
    }
    playMoveSound(mv)
    setFen(c.fen())
    setLast({ from: mv.from, to: mv.to })
    void evaluate(toUci({ from: mv.from, to: mv.to, promotion: mv.promotion as MoveInput['promotion'] }), mv.san)
    return true
  }

  function retry() {
    setFen(startFen)
    setLast(null)
    setState('idle')
    setArrows([])
    setDetail('')
  }

  const turn = new Chess(startFen).turn()
  return (
    <Layout
      board={
        <ChessBoard
          fen={fen}
          onMove={onMove}
          orientation={turn === 'w' ? 'white' : 'black'}
          movable={state === 'idle' ? turn : 'none'}
          lastMove={last ?? lastMoveOf(step)}
          arrows={arrows}
        />
      }
    >
      <span className="chip">{SKILL_LABEL.strategy} · Plan bul</span>
      <p className="lesson-text">
        <RichText text={step.text} />
      </p>
      {state === 'thinking' && <p className="muted small">Motor değerlendiriyor…</p>}
      {(state === 'good' || state === 'bad') && (
        <>
          <p className={`msg ${state}`}>{detail}</p>
          <p className="lesson-text small">
            <RichText text={step.explanation} />
          </p>
          <div className="puzzle-actions">
            <button className="btn" onClick={retry}>
              ⟲ Tekrar dene
            </button>
          </div>
          {footer}
        </>
      )}
    </Layout>
  )
}

/** Veritabanından art arda N bulmaca (ders pratiği ya da sınav) */
export function PuzzleSet({
  count,
  themes,
  skill,
  maxUserMoves,
  targetRating,
  mode,
  intro,
  onFinish,
  footer,
}: {
  count: number
  themes?: string[]
  skill?: Skill
  maxUserMoves?: number
  targetRating: (skill: Skill) => number
  mode: 'practice' | 'test'
  intro: React.ReactNode
  onFinish: (solved: number, total: number) => void
  footer: (solved: number, total: number) => React.ReactNode
}) {
  const [all, setAll] = useState<Puzzle[] | null>(null)
  const [index, setIndex] = useState(0)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const used = useRef<string[]>([])

  const pick = (ps: Puzzle[]) => {
    const p = pickPuzzle(ps, {
      themes,
      skill,
      rating: targetRating(skill ?? 'tactics'),
      exclude: [...getProfile().seen, ...used.current],
      maxUserMoves,
    })
    if (p) used.current.push(p.id)
    return p
  }

  useEffect(() => {
    void loadPuzzles().then((ps) => {
      setAll(ps)
      setPuzzle(pick(ps))
    })
    // Yalnızca ilk yüklemede seç; sonraki seçimler "Sonraki" ile yapılır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exercise = useMemo(() => (puzzle ? puzzleToExercise(puzzle) : null), [puzzle])
  const finished = results.length >= count
  const solved = results.filter(Boolean).length

  function complete(o: ExerciseOutcome) {
    if (!puzzle) return
    recordResult({ id: puzzle.id, skills: puzzleSkills(puzzle), rating: puzzle.rating, score: outcomeScore(o) })
    if (!o.success) addMistake({ id: `p:${puzzle.id}`, kind: 'puzzle', puzzleId: puzzle.id })
    const next = [...results, o.success]
    setResults(next)
    if (next.length >= count) onFinish(next.filter(Boolean).length, next.length)
  }

  function next() {
    if (!all) return
    setIndex((i) => i + 1)
    setPuzzle(pick(all))
  }

  if (!all) return <p className="muted">Bulmacalar yükleniyor…</p>
  if (!exercise || !puzzle) return <p className="muted">Uygun bulmaca bulunamadı.</p>

  return (
    <PuzzlePlayer
      key={`${exercise.id}-${index}`}
      exercise={exercise}
      mode={mode}
      onComplete={complete}
      header={
        <>
          {intro}
          <div className="set-dots">
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className={i < results.length ? (results[i] ? 'ok' : 'no') : i === results.length ? 'cur' : ''} />
            ))}
          </div>
        </>
      }
    >
      {finished ? (
        footer(solved, results.length)
      ) : (
        <button className="btn primary" onClick={next} autoFocus>
          Sonraki ({results.length + 1}/{count}) →
        </button>
      )}
    </PuzzlePlayer>
  )
}
