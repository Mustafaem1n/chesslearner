import { Chess } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { ChessBoard, type Highlight } from '../../board/ChessBoard'
import type { MoveInput } from '../../board/moves'
import { playMoveSound, playSound } from '../../core/sound'
import { CLASSIC_GAMES, type ClassicGame } from '../../data/games'
import { getEngine } from '../../engine/engine'
import { lineValue } from '../../engine/score'
import '../puzzle/puzzle.css'
import '../opening/opening.css'

export function GuessPage() {
  const [game, setGame] = useState<ClassicGame | null>(null)
  const [key, setKey] = useState(0)
  if (game) return <GuessPlayer key={`${game.id}-${key}`} game={game} onBack={() => setGame(null)} onAgain={() => setKey((k) => k + 1)} />
  return (
    <div className="openings">
      <div className="page-head">
        <h1>Hamleyi tahmin et</h1>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>
        Ünlü oyunları ustaların gözünden oyna: her hamlede ustanın ne oynadığını tahmin et. Aynı hamle 3 puan, motorun iyi
        bulduğu bir alternatif 1 puan.
      </p>
      <div className="course-grid">
        {CLASSIC_GAMES.map((g) => (
          <button key={g.id} className="course-card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setGame(g)}>
            <div className="course-top">
              <span className={`side-dot ${g.side}`} />
              <b>
                {g.white} – {g.black}
              </b>
            </div>
            <span className="muted small">{g.event}</span>
            <span className="muted small">{g.intro}</span>
            <span className="chip" style={{ alignSelf: 'flex-start' }}>
              ~{g.rating}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function GuessPlayer({ game, onBack, onAgain }: { game: ClassicGame; onBack: () => void; onAgain: () => void }) {
  const sans = useMemo(() => game.pgn.split(' '), [game])
  const [ply, setPly] = useState(0)
  const [score, setScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'good' | 'bad' | 'info'; text: string } | null>({ kind: 'info', text: game.intro })
  const [highlights, setHighlights] = useState<Partial<Record<string, Highlight>>>({})
  const chess = useMemo(() => {
    const c = new Chess()
    for (const s of sans.slice(0, ply)) c.move(s)
    return c
  }, [sans, ply])
  const fen = chess.fen()
  const last = chess.history({ verbose: true }).at(-1)
  const finished = ply >= sans.length
  const userTurn = !finished && chess.turn() === game.side

  // Rakip hamleleri otomatik
  useEffect(() => {
    if (finished || userTurn || busy) return
    const t = window.setTimeout(() => {
      const mv = new Chess(fen).move(sans[ply])
      playMoveSound(mv)
      setPly((p) => p + 1)
    }, 700)
    return () => clearTimeout(t)
  }, [finished, userTurn, busy, fen, sans, ply])

  async function onMoveAsync(m: MoveInput, san: string) {
    const actual = sans[ply]
    setMaxScore((x) => x + 3)
    if (san === actual) {
      playSound('success')
      setScore((s) => s + 3)
      setMsg({ kind: 'good', text: `Doğru! Usta da ${actual} oynadı. (+3)` })
      setPly((p) => p + 1)
      return
    }
    setBusy(true)
    setMsg({ kind: 'info', text: 'Tahminin değerlendiriliyor…' })
    const engine = getEngine()
    const c = new Chess(fen)
    c.move(m)
    const [mine, theirs] = await Promise.all([
      engine.analyse(c.fen(), { depth: 12 }),
      (() => {
        const d = new Chess(fen)
        d.move(actual)
        return engine.analyse(d.fen(), { depth: 12 })
      })(),
    ])
    const myVal = mine.lines[0] ? -lineValue(mine.lines[0]) : 0
    const theirVal = theirs.lines[0] ? -lineValue(theirs.lines[0]) : 0
    const good = theirVal - myVal <= 50 || c.isCheckmate()
    if (good) setScore((s) => s + 1)
    playSound(good ? 'notify' : 'error')
    setMsg({
      kind: good ? 'info' : 'bad',
      text: good
        ? `${san} de iyi bir hamle (+1). Usta ${actual} oynadı.`
        : `${san} zayıf kalıyor. Usta ${actual} oynadı.`,
    })
    const from = new Chess(fen).move(actual)
    setHighlights({ [from.to]: 'good' })
    setPly((p) => p + 1)
    setBusy(false)
  }

  function onMove(m: MoveInput): boolean {
    if (!userTurn || busy) return false
    let san: string
    try {
      san = new Chess(fen).move(m).san
    } catch {
      return false
    }
    setHighlights({})
    void onMoveAsync(m, san)
    return true
  }

  const pairs: string[] = []
  sans.slice(0, ply).forEach((s, i) => (i % 2 === 0 ? pairs.push(`${i / 2 + 1}. ${s}`) : (pairs[pairs.length - 1] += ` ${s}`)))

  return (
    <div className="puzzle">
      <ChessBoard
        fen={fen}
        onMove={onMove}
        orientation={game.side === 'w' ? 'white' : 'black'}
        movable={userTurn && !busy ? game.side : 'none'}
        lastMove={last ? { from: last.from, to: last.to } : null}
        highlights={highlights}
      />
      <aside className="puzzle-side card">
        <div>
          <b>
            {game.white} – {game.black}
          </b>
          <div className="muted small">{game.event}</div>
        </div>
        <div className="goal">
          Puan: <b>{score}</b>
          <span className="moves-left">
            {maxScore ? `%${Math.round((score / maxScore) * 100)}` : ''} · {Math.min(ply, sans.length)}/{sans.length} yarım hamle
          </span>
        </div>
        {msg && <p className={`msg ${msg.kind}`}>{msg.text}</p>}
        {userTurn && !busy && <p className="muted small" style={{ margin: 0 }}>Sıra ustada: ne oynardı?</p>}
        <div className="line-moves">{pairs.join('  ') || <span className="muted">Başlangıç</span>}</div>
        {finished && <p className="msg good">Oyun bitti! Toplam {score} / {maxScore} puan.</p>}
        <div className="puzzle-actions">
          {finished && (
            <button className="btn primary" onClick={onAgain}>
              Tekrar
            </button>
          )}
          <button className="btn" onClick={onBack}>
            Oyun listesi
          </button>
        </div>
      </aside>
    </div>
  )
}
