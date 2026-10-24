import { Chess } from 'chess.js'
import { useEffect, useRef, useState } from 'react'
import { ChessBoard } from '../../board/ChessBoard'
import { parseUci, type MoveInput } from '../../board/moves'
import { playMoveSound, playSound } from '../../core/sound'
import type { HalfGame } from '../../data/endgames'
import { getEngine } from '../../engine/engine'
import { lineValue, isMateValue } from '../../engine/score'
import '../puzzle/puzzle.css'

export interface HalfGameOutcome {
  success: boolean
  movesUsed: number
  reason: string
}

interface Props {
  game: HalfGame
  onComplete?: (o: HalfGameOutcome) => void
  children?: React.ReactNode
  header?: React.ReactNode
  /** Test modunda ipucu ve tekrar yok */
  mode?: 'practice' | 'test'
}

type Phase = 'user' | 'engine' | 'done'

const GOAL_TEXT: Record<HalfGame['goal'], (n: number) => string> = {
  mate: (n) => `${n} hamle içinde mat et`,
  win: (n) => `${n} hamle içinde kazanılmış pozisyona ulaş`,
  promote: (n) => `${n} hamle içinde piyonu terfi ettir`,
  draw: (n) => `${n} hamle boyunca kaybetmeden dayan`,
}

const countQueens = (chess: Chess, color: 'w' | 'b') =>
  chess.board().flat().filter((p) => p && p.type === 'q' && p.color === color).length

const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const material = (chess: Chess, color: 'w' | 'b') =>
  chess
    .board()
    .flat()
    .reduce((sum, p) => sum + (p && p.color === color ? VALUES[p.type] : 0), 0)

export function HalfGamePlayer({ game, onComplete, children, header, mode = 'practice' }: Props) {
  const [fen, setFen] = useState(game.fen)
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [phase, setPhase] = useState<Phase>('user')
  const [moves, setMoves] = useState(0)
  const [message, setMessage] = useState<{ kind: 'info' | 'good' | 'bad'; text: string } | null>(null)
  const [hintIdx, setHintIdx] = useState(0)
  const [userColor] = useState<'w' | 'b'>(() => new Chess(game.fen).turn())
  const [initialQueens] = useState(() => countQueens(new Chess(game.fen), userColor))
  const [initialMaterial] = useState(() => material(new Chess(game.fen), userColor))
  const reported = useRef(false)
  /** Her denemede/ayrılışta artar; eski motor cevapları yok sayılır */
  const gen = useRef(0)

  useEffect(() => {
    getEngine().newGame()
    const g = gen
    return () => {
      g.current++
    }
  }, [])

  function end(success: boolean, reason: string) {
    setPhase('done')
    setMessage({ kind: success ? 'good' : 'bad', text: reason })
    playSound(success ? 'success' : 'error')
    if (!reported.current) {
      reported.current = true
      onComplete?.({ success, movesUsed: moves + 1, reason })
    }
  }

  /** Oyun bitiş durumlarını kontrol eder; oyun bittiyse true. */
  function checkTerminal(chess: Chess, byUser: boolean): boolean {
    if (chess.isCheckmate()) {
      if (byUser) end(true, 'Mat! Harika.')
      else end(false, 'Mat oldun.')
      return true
    }
    if (chess.isStalemate()) {
      end(game.goal === 'draw', game.goal === 'draw' ? 'Pat — beraberlik sağlandı.' : 'Pat! Rakibe hamle bırakmalıydın.')
      return true
    }
    if (chess.isInsufficientMaterial() || chess.isThreefoldRepetition() || chess.isDraw()) {
      end(game.goal === 'draw', game.goal === 'draw' ? 'Beraberlik sağlandı.' : 'Pozisyon beraberliğe gitti.')
      return true
    }
    return false
  }

  async function engineTurn(chess: Chess, usedMoves: number) {
    setPhase('engine')
    const myGen = gen.current
    let res
    try {
      res = await getEngine().analyse(chess.fen(), { movetime: 450, depth: 20 })
    } catch {
      return
    }
    if (gen.current !== myGen || !res.bestMove) return
    const top = res.lines[0]
    const userEval = top ? -lineValue(top) : 0
    const userHasMate = isMateValue(userEval) && userEval > 0

    // Hedefin artık imkânsız olduğu durumlar
    if ((game.goal === 'win' || game.goal === 'promote') && userEval < 60) {
      return end(false, 'Kazanç kaçtı — pozisyon artık kazanılmıyor.')
    }
    // Temel matlarda motor (tablebase olmadan) değerlendirmeyi düşük gösterebilir; ölçüt taş kaybıdır
    if (game.goal === 'mate' && material(chess, userColor) < initialMaterial) {
      return end(false, 'Taş kaybettin — mat imkânı kaçtı.')
    }
    if (game.goal === 'draw' && userEval < -450) {
      return end(false, 'Pozisyon kaybedildi.')
    }

    await new Promise((r) => setTimeout(r, 250))
    if (gen.current !== myGen) return
    const mv = chess.move(parseUci(res.bestMove))
    playMoveSound(mv)
    setFen(chess.fen())
    setLastMove({ from: mv.from, to: mv.to })
    if (checkTerminal(chess, false)) return

    if (game.goal === 'promote' && countQueens(chess, userColor) > initialQueens) {
      return end(true, 'Terfi tamam — vezir hayatta. Kazandın!')
    }
    if (game.goal === 'win' && (userHasMate || userEval >= 1500)) {
      return end(true, 'Kazanılmış pozisyona ulaştın!')
    }
    if (usedMoves >= game.moveLimit) {
      if (game.goal === 'draw') return end(true, `${game.moveLimit} hamle dayandın — beraberlik!`)
      return end(false, 'Hamle sınırı doldu.')
    }
    setPhase('user')
  }

  function onMove(m: MoveInput): boolean {
    if (phase !== 'user') return false
    const chess = new Chess(fen)
    let mv
    try {
      mv = chess.move(m)
    } catch {
      return false
    }
    playMoveSound(mv)
    const used = moves + 1
    setMoves(used)
    setFen(chess.fen())
    setLastMove({ from: mv.from, to: mv.to })
    setMessage(null)
    if (!checkTerminal(chess, true)) void engineTurn(chess, used)
    return true
  }

  function retry() {
    reported.current = false
    gen.current++
    setFen(game.fen)
    setLastMove(null)
    setPhase('user')
    setMoves(0)
    setMessage(null)
    setHintIdx(0)
  }

  const hints = game.hints ?? []

  return (
    <div className="puzzle">
      <ChessBoard
        fen={fen}
        onMove={onMove}
        orientation={userColor === 'w' ? 'white' : 'black'}
        movable={phase === 'user' ? userColor : 'none'}
        lastMove={lastMove}
      />
      <aside className="puzzle-side card">
        {header}
        <h3>{game.title}</h3>
        <p className="muted small" style={{ margin: 0 }}>
          {game.description}
        </p>
        <div className="goal">
          <b>Hedef:</b> {GOAL_TEXT[game.goal](game.moveLimit)}
          <span className="moves-left">
            {moves}/{game.moveLimit}
          </span>
        </div>
        <div className="progress">
          <div style={{ width: `${Math.min(100, (moves / game.moveLimit) * 100)}%` }} />
        </div>
        {phase === 'engine' && <p className="muted small">Rakip düşünüyor…</p>}
        {message && <p className={`msg ${message.kind}`}>{message.text}</p>}
        {mode === 'practice' && hintIdx > 0 && (
          <ul className="hint-list">
            {hints.slice(0, hintIdx).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <div className="puzzle-actions">
          {mode === 'practice' && phase !== 'done' && hintIdx < hints.length && (
            <button className="btn" onClick={() => setHintIdx((i) => i + 1)}>
              💡 İpucu
            </button>
          )}
          {mode === 'practice' && (
            <button className="btn" onClick={retry}>
              ⟲ Baştan
            </button>
          )}
        </div>
        {phase === 'done' && children}
      </aside>
    </div>
  )
}
