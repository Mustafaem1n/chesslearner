import { Chess } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import type { Arrow } from 'react-chessboard'
import { ChessBoard, type Highlight } from '../../board/ChessBoard'
import type { MoveInput } from '../../board/moves'
import { RichText } from '../../components/RichText'
import { playMoveSound, playSound } from '../../core/sound'
import { parseLine } from '../../data/openings'
import '../puzzle/puzzle.css'
import './opening.css'

export interface LineResult {
  mistakes: number
}

interface Props {
  pgn: string
  side: 'w' | 'b'
  /** learn: doğru hamle okla gösterilir; drill: ezberden */
  mode: 'learn' | 'drill'
  title: string
  onComplete: (r: LineResult) => void
  children?: React.ReactNode
}

/** Bir açılış hattını hamle hamle oynatır; kullanıcı kendi tarafının hamlelerini yapar. */
export function LineTrainer({ pgn, side, mode, title, onComplete, children }: Props) {
  const { sans, notes } = useMemo(() => parseLine(pgn), [pgn])
  const [ply, setPly] = useState(0)
  const [fen, setFen] = useState(new Chess().fen())
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<Partial<Record<string, Highlight>>>({})
  const [revealed, setRevealed] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  const finished = ply >= sans.length
  const userTurn = !finished && (ply % 2 === 0) === (side === 'w')

  // Rakip hamlelerini otomatik oynat
  useEffect(() => {
    if (finished || userTurn) return
    const t = window.setTimeout(() => {
      const chess = new Chess(fen)
      const mv = chess.move(sans[ply])
      playMoveSound(mv)
      setFen(chess.fen())
      setLastMove({ from: mv.from, to: mv.to })
      setHistory((h) => [...h, mv.san])
      if (notes[ply]) setNote(notes[ply]!)
      setPly(ply + 1)
    }, ply === 0 ? 500 : 550)
    return () => clearTimeout(t)
  }, [ply, finished, userTurn, fen, sans, notes])

  const expected = useMemo(() => {
    if (!userTurn) return null
    const mv = new Chess(fen).move(sans[ply])
    return { from: mv.from, to: mv.to }
  }, [userTurn, fen, sans, ply])

  function onMove(m: MoveInput): boolean {
    if (!userTurn || !expected) return false
    const chess = new Chess(fen)
    let mv
    try {
      mv = chess.move(m)
    } catch {
      return false
    }
    if (mv.san !== sans[ply]) {
      setMistakes((n) => n + 1)
      playSound('error')
      setError(`${mv.san} değil. ${mode === 'drill' ? 'Doğru hamle okla gösterildi.' : 'Oku takip et.'}`)
      setHighlights({ [mv.to]: 'bad' })
      setRevealed(true)
      return false
    }
    playMoveSound(mv)
    setError(null)
    setHighlights({})
    setRevealed(false)
    setFen(chess.fen())
    setLastMove({ from: mv.from, to: mv.to })
    setHistory((h) => [...h, mv.san])
    setNote(notes[ply] ?? null)
    const nextPly = ply + 1
    setPly(nextPly)
    if (nextPly >= sans.length) {
      playSound('success')
      onComplete({ mistakes })
    }
    return true
  }

  const showArrow = expected && (mode === 'learn' || revealed)
  const arrows: Arrow[] = showArrow ? [{ startSquare: expected.from, endSquare: expected.to, color: 'rgb(60 120 220 / 0.85)' }] : []

  const pairs: string[] = []
  history.forEach((san, i) => {
    if (i % 2 === 0) pairs.push(`${i / 2 + 1}. ${san}`)
    else pairs[pairs.length - 1] += ` ${san}`
  })

  return (
    <div className="puzzle">
      <ChessBoard
        fen={fen}
        onMove={onMove}
        orientation={side === 'w' ? 'white' : 'black'}
        movable={userTurn ? side : 'none'}
        lastMove={lastMove}
        arrows={arrows}
        highlights={highlights}
      />
      <aside className="puzzle-side card">
        <div>
          <span className="chip">{mode === 'learn' ? 'Öğren' : 'Ezberden'}</span>
          <h3 style={{ marginTop: 8 }}>{title}</h3>
        </div>
        <div className="line-moves">{pairs.join('  ') || <span className="muted">Başlangıç pozisyonu</span>}</div>
        {note && (
          <p className="msg info">
            <RichText text={note} />
          </p>
        )}
        {error && <p className="msg bad">{error}</p>}
        {!finished && (
          <p className="muted small" style={{ margin: 0 }}>
            {userTurn ? (mode === 'learn' ? 'Oktaki hamleyi oyna.' : 'Repertuvarındaki hamleyi oyna.') : 'Rakip oynuyor…'}
          </p>
        )}
        {finished && (
          <p className={`msg ${mistakes ? 'info' : 'good'}`}>
            Hat tamamlandı{mistakes ? ` (${mistakes} hata)` : ' — hatasız!'}
          </p>
        )}
        {finished && children}
      </aside>
    </div>
  )
}
