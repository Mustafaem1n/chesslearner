import { useEffect, useMemo, useState } from 'react'
import { ChessBoard, type Highlight } from '../../board/ChessBoard'
import { playSound } from '../../core/sound'
import { addMistake, getProfile, recordResult } from '../../core/store'
import { loadPuzzles, outcomeScore, pickPuzzle, puzzleSkills, puzzleToExercise, type Puzzle } from '../../data/puzzles'
import { PuzzlePlayer } from '../puzzle/PuzzlePlayer'
import '../lesson/lesson.css'

type Tab = 'coords' | 'hidden'

export function VisualPage() {
  const [tab, setTab] = useState<Tab>('coords')
  return (
    <div>
      <div className="page-head">
        <h1>Görselleştirme</h1>
        <div className="seg">
          <button className={tab === 'coords' ? 'on' : ''} onClick={() => setTab('coords')}>
            Koordinatlar
          </button>
          <button className={tab === 'hidden' ? 'on' : ''} onClick={() => setTab('hidden')}>
            Gizli taşlar
          </button>
        </div>
      </div>
      {tab === 'coords' ? <CoordTrainer /> : <HiddenPuzzles />}
    </div>
  )
}

const ALL = Array.from({ length: 64 }, (_, i) => `${'abcdefgh'[i % 8]}${Math.floor(i / 8) + 1}`)
const randomSquare = (except?: string) => {
  let t = except
  while (t === except) t = ALL[Math.floor(Math.random() * 64)]
  return t!
}

/** 30 saniyede olabildiğince çok kareyi bul (tahta yönü seçilebilir) */
function CoordTrainer() {
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(30)
  const [target, setTarget] = useState(randomSquare)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<Partial<Record<string, Highlight>>>({})
  const [best, setBest] = useState(() => {
    try {
      return Number(localStorage.getItem('coord-best') ?? 0)
    } catch {
      return 0
    }
  })

  // Süre sıfıra inince aralık kendiliğinden durur
  const active = running && left > 0
  useEffect(() => {
    if (!active) return
    const t = window.setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [active])

  function click(sq: string) {
    if (!active) return
    const ok = sq === target
    playSound(ok ? 'move' : 'error')
    setFlash({ [sq]: ok ? 'good' : 'bad' })
    if (ok) {
      const next = score + 1
      setScore(next)
      if (next > best) {
        setBest(next)
        try {
          localStorage.setItem('coord-best', String(next))
        } catch {
          /* depolama kapalı */
        }
      }
    }
    setTarget(randomSquare(target))
  }

  const squares = orientation === 'white' ? ALL : [...ALL].reverse()
  return (
    <div className="puzzle">
      <div className="squares-board">
        <ChessBoard fen="8/8/8/8/8/8/8/8 w - - 0 1" movable="none" highlights={flash} orientation={orientation} />
        <div className="squares-grid">
          {squares.map((sq) => {
            const col = orientation === 'white' ? sq.charCodeAt(0) - 96 : 105 - sq.charCodeAt(0)
            const row = orientation === 'white' ? 9 - Number(sq[1]) : Number(sq[1])
            return <button key={sq} aria-label={sq} style={{ gridColumn: col, gridRow: row }} onClick={() => click(sq)} />
          })}
        </div>
      </div>
      <aside className="puzzle-side card">
        <p className="lesson-text">30 saniyede söylenen karelere tıkla. Koordinatları ezbere bilmek, hamle notasyonunu okumayı ve hesaplamayı hızlandırır.</p>
        {active ? <div className="big-target">{target}</div> : <div className="big-target muted">{left <= 0 ? score : '—'}</div>}
        <div className="goal">
          Skor: <b>{score}</b>
          <span className="moves-left">
            {active ? `${left} sn` : `En iyi: ${best}`}
          </span>
        </div>
        <div className="puzzle-actions">
          <button
            className="btn primary"
            disabled={active}
            onClick={() => {
              setScore(0)
              setLeft(30)
              setTarget(randomSquare())
              setRunning(true)
            }}
          >
            {left <= 0 ? 'Tekrar' : 'Başla'}
          </button>
          <button className="btn" disabled={active} onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>
            ⇅ {orientation === 'white' ? 'Siyah' : 'Beyaz'} tarafından bak
          </button>
        </div>
      </aside>
    </div>
  )
}

/** Pozisyonu birkaç saniye göster, sonra taşları gizle; kullanıcı çözümü hafızadan oynar */
function HiddenPuzzles() {
  const [all, setAll] = useState<Puzzle[] | null>(null)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [hidden, setHidden] = useState(false)
  const [done, setDone] = useState(false)
  const [memorize, setMemorize] = useState(6)
  const [countdown, setCountdown] = useState(0)

  const pick = (ps: Puzzle[]) => {
    const p = getProfile()
    return pickPuzzle(ps, { rating: p.ratings.tactics.r - 300, exclude: p.seen, maxUserMoves: 2 })
  }

  useEffect(() => {
    void loadPuzzles().then((ps) => {
      setAll(ps)
      setPuzzle(pick(ps))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Kurulum hamlesinden sonra ezber süresi başlar
  useEffect(() => {
    if (!puzzle) return
    setHidden(false)
    setDone(false)
    setCountdown(memorize)
    const start = window.setTimeout(() => {
      const iv = window.setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(iv)
            setHidden(true)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }, 1000)
    return () => clearTimeout(start)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle])

  const exercise = useMemo(() => (puzzle ? puzzleToExercise(puzzle) : null), [puzzle])
  if (!all || !exercise || !puzzle) return <p className="muted">Yükleniyor…</p>

  return (
    <PuzzlePlayer
      key={exercise.id}
      exercise={exercise}
      hidePieces={hidden}
      onComplete={(o) => {
        setDone(true)
        recordResult({ id: puzzle.id, skills: [...puzzleSkills(puzzle), 'calculation'], rating: puzzle.rating + 150, score: outcomeScore(o) })
        if (!o.success) addMistake({ id: `p:${puzzle.id}`, kind: 'puzzle', puzzleId: puzzle.id })
      }}
      header={
        <>
          <p className="lesson-text">
            Pozisyonu ezberle: {memorize} saniye sonra taşlar kaybolacak. Çözümü hafızandan oyna (kareye tıklayarak).
          </p>
          <div className="goal">
            {hidden ? <b>Taşlar gizli</b> : <b>Ezberle: {countdown} sn</b>}
            <span className="moves-left">
              Süre:{' '}
              <select className="select" value={memorize} onChange={(e) => setMemorize(Number(e.target.value))}>
                {[3, 6, 10, 15].map((s) => (
                  <option key={s} value={s}>
                    {s} sn
                  </option>
                ))}
              </select>
            </span>
          </div>
        </>
      }
    >
      {done && (
        <button className="btn primary" onClick={() => setPuzzle(pick(all))}>
          Sonraki →
        </button>
      )}
    </PuzzlePlayer>
  )
}
