import { validateFen } from 'chess.js'
import { useState } from 'react'
import { ChessBoard } from '../../board/ChessBoard'
import { statusText } from '../../board/moves'
import { useChessGame } from '../../board/useChessGame'
import './sandbox.css'

export function SandboxPage() {
  const game = useChessGame()
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [fenInput, setFenInput] = useState('')
  const [fenError, setFenError] = useState<string | null>(null)

  const pairs: { n: number; w?: string; b?: string }[] = []
  game.history.forEach((m, i) => {
    if (m.color === 'w' || i === 0) pairs.push({ n: pairs.length + 1 })
    pairs[pairs.length - 1][m.color] = m.san
  })

  function loadFen() {
    const fen = fenInput.trim()
    const result = validateFen(fen)
    if (!result.ok) {
      setFenError(result.error ?? 'Geçersiz FEN')
      return
    }
    setFenError(null)
    game.load(fen)
  }

  return (
    <div className="sandbox">
      <ChessBoard
        fen={game.fen}
        onMove={(m) => game.move(m) !== null}
        orientation={orientation}
        lastMove={game.lastMove}
      />
      <aside className="side card">
        <h2>Serbest tahta</h2>
        <p className={`status ${game.status.kind !== 'playing' ? 'over' : ''}`}>{statusText(game.status)}</p>

        <div className="moves">
          {pairs.length === 0 && <span className="muted">Henüz hamle yok.</span>}
          {pairs.map((p) => (
            <div key={p.n} className="move-row">
              <span className="move-num">{p.n}.</span>
              <span>{p.w ?? '…'}</span>
              <span>{p.b ?? ''}</span>
            </div>
          ))}
        </div>

        <div className="controls">
          <button className="btn" onClick={game.undo} disabled={game.history.length === 0}>
            ↶ Geri al
          </button>
          <button className="btn" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>
            ⇅ Çevir
          </button>
          <button className="btn" onClick={() => game.load()}>
            ⟲ Baştan
          </button>
        </div>

        <div className="fen">
          <label className="muted" htmlFor="fen">
            FEN yükle
          </label>
          <div className="fen-row">
            <input
              id="fen"
              value={fenInput}
              placeholder={game.fen}
              onChange={(e) => setFenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadFen()}
            />
            <button className="btn" onClick={loadFen} disabled={!fenInput.trim()}>
              Yükle
            </button>
          </div>
          {fenError && <span className="fen-error">{fenError}</span>}
        </div>
      </aside>
    </div>
  )
}
