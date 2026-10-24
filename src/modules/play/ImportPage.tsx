import { Chess } from 'chess.js'
import { useState } from 'react'
import { AnalysisView } from './AnalysisView'
import './play.css'

/** Lichess / Chess.com'dan kopyalanan PGN'i analiz eder; kullanıcının hataları hata defterine girer. */
export function ImportPage() {
  const [pgn, setPgn] = useState('')
  const [color, setColor] = useState<'w' | 'b'>('w')
  const [game, setGame] = useState<{ sans: string[]; key: number; title: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function analyse() {
    const chess = new Chess()
    try {
      chess.loadPgn(pgn.trim())
    } catch (e) {
      setError(`PGN okunamadı: ${(e as Error).message}`)
      return
    }
    const sans = chess.history()
    if (sans.length < 2) {
      setError('PGN\'de yeterli hamle yok.')
      return
    }
    const h = chess.getHeaders()
    setError(null)
    setGame({ sans, key: Date.now(), title: h.White && h.Black ? `${h.White} – ${h.Black}` : 'İçe aktarılan oyun' })
  }

  if (game) {
    return (
      <div>
        <div className="page-head">
          <h1>{game.title}</h1>
          <button className="btn" onClick={() => setGame(null)}>
            Başka oyun
          </button>
        </div>
        <AnalysisView key={game.key} sans={game.sans} userColor={color} />
      </div>
    )
  }

  return (
    <div className="play-setup">
      <h1>Kendi oyununu analiz et</h1>
      <p className="muted" style={{ margin: 0 }}>
        Lichess ya da Chess.com'daki bir oyununun PGN'ini yapıştır. Her hamlen değerlendirilir; hataların hata defterine
        girer ve tekrar bölümünde bulmaca olarak karşına çıkar.
      </p>
      <textarea
        className="pgn-input"
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        placeholder={'[Event "..."]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ...'}
      />
      <div className="color-pick seg">
        {(
          [
            ['w', 'Beyazdım'],
            ['b', 'Siyahtım'],
          ] as const
        ).map(([c, label]) => (
          <button key={c} className={color === c ? 'on' : ''} onClick={() => setColor(c)}>
            {label}
          </button>
        ))}
      </div>
      {error && <p className="msg bad">{error}</p>}
      <div>
        <button className="btn primary" onClick={analyse} disabled={!pgn.trim()}>
          Analiz et
        </button>
      </div>
    </div>
  )
}
