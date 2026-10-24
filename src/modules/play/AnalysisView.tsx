import { useEffect, useRef, useState } from 'react'
import { ChessBoard } from '../../board/ChessBoard'
import { addMistake } from '../../core/store'
import { analyseGame, CLASS_LABEL, winPct, type GameAnalysis } from './analysis'
import './play.css'

interface Props {
  sans: string[]
  userColor: 'w' | 'b' | null
  startFen?: string
  /** Analiz bitince (ör. oyun kaydını güncellemek için) */
  onAnalysed?: (a: GameAnalysis) => void
}

/** Oyun analizi: değerlendirme grafiği, hamle sınıfları, tahtada gezinme. Kullanıcının hataları deftere eklenir. */
export function AnalysisView({ sans, userColor, startFen, onAnalysed }: Props) {
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null)
  const [progress, setProgress] = useState(0)
  const [ply, setPly] = useState(sans.length - 1)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void analyseGame(sans, { startFen, onProgress: (d, t) => setProgress(d / t) }).then((a) => {
      setAnalysis(a)
      if (userColor) {
        for (const m of a.moves) {
          if (m.color !== userColor || (m.cls !== 'mistake' && m.cls !== 'blunder') || !m.best) continue
          addMistake({
            id: `g:${m.fenBefore}`,
            kind: 'position',
            fen: m.fenBefore,
            best: [m.best],
            note: `Oyununda burada ${m.san} oynadın (${CLASS_LABEL[m.cls].label.toLowerCase()}). Daha iyisini bul.`,
          })
        }
      }
      onAnalysed?.(a)
    })
  }, [sans, startFen, userColor, onAnalysed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setPly((p) => Math.max(-1, p - 1))
      if (e.key === 'ArrowRight') setPly((p) => Math.min(sans.length - 1, p + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sans.length])

  if (!analysis) {
    return (
      <div className="card analysis-loading">
        <b>Oyun analiz ediliyor…</b>
        <div className="progress">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="muted small">Her pozisyon motorla değerlendiriliyor.</span>
      </div>
    )
  }

  const current = ply >= 0 ? analysis.moves[ply] : null
  // Hatalı hamlelerde hamleden önceki pozisyonu göster: kırmızı oynanan, yeşil en iyi hamle
  const showAlt = !!current && !!current.best && ['inaccuracy', 'mistake', 'blunder'].includes(current.cls)
  const fen = current ? (showAlt ? current.fenBefore : current.fenAfter) : (analysis.moves[0]?.fenBefore ?? startFen ?? '')
  const mistakesByUser = userColor
    ? analysis.moves.filter((m) => m.color === userColor && (m.cls === 'mistake' || m.cls === 'blunder')).length
    : 0

  // Değerlendirme grafiği (beyazın kazanma yüzdesi)
  const W = 560
  const H = 110
  const pts = analysis.moves.map((m, i) => [
    (i / Math.max(1, analysis.moves.length - 1)) * W,
    H - (winPct(m.evalAfter) / 100) * H,
  ])
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')

  return (
    <div className="analysis">
      <div className="puzzle">
        <ChessBoard
          fen={fen}
          movable="none"
          orientation={userColor === 'b' ? 'black' : 'white'}
          lastMove={current && !showAlt ? { from: current.uci.slice(0, 2), to: current.uci.slice(2, 4) } : null}
          arrows={
            showAlt
              ? [
                  { startSquare: current!.uci.slice(0, 2), endSquare: current!.uci.slice(2, 4), color: 'rgb(220 70 60 / 0.8)' },
                  { startSquare: current!.best!.slice(0, 2), endSquare: current!.best!.slice(2, 4), color: 'rgb(60 160 80 / 0.85)' },
                ]
              : []
          }
        />
        <aside className="puzzle-side card">
          <div className="acc-row">
            {(['w', 'b'] as const).map((c) => (
              <div key={c} className="acc">
                <span className={`side-dot ${c}`} />
                <b>%{analysis.accuracy[c]}</b>
                <span className="muted small">isabet</span>
                <span className="muted small">
                  {analysis.counts[c].blunder}?? · {analysis.counts[c].mistake}? · {analysis.counts[c].inaccuracy}?!
                </span>
              </div>
            ))}
          </div>
          {userColor && (
            <p className="muted small" style={{ margin: 0 }}>
              {mistakesByUser
                ? `${mistakesByUser} hatan hata defterine eklendi; tekrar bölümünde karşına çıkacak.`
                : 'Ciddi hata yok — tebrikler!'}
            </p>
          )}
          <svg className="eval-graph" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Değerlendirme grafiği">
            <rect x="0" y="0" width={W} height={H} className="eval-bg" />
            <path d={`${path} L${W},${H} L0,${H} Z`} className="eval-white" />
            <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="eval-mid" />
            {ply >= 0 && <line x1={pts[ply][0]} x2={pts[ply][0]} y1="0" y2={H} className="eval-cursor" />}
            {analysis.moves.map((m, i) =>
              m.cls === 'blunder' || m.cls === 'mistake' ? (
                <circle key={i} cx={pts[i][0]} cy={pts[i][1]} r="4" className={`eval-dot ${m.cls}`} />
              ) : null,
            )}
            <rect
              x="0"
              y="0"
              width={W}
              height={H}
              fill="transparent"
              onClick={(e) => {
                const box = (e.target as SVGRectElement).getBoundingClientRect()
                const i = Math.round(((e.clientX - box.left) / box.width) * (analysis.moves.length - 1))
                setPly(i)
              }}
            />
          </svg>
          {current && (
            <p className={`msg ${current.cls === 'blunder' || current.cls === 'mistake' ? 'bad' : current.cls === 'inaccuracy' ? 'info' : 'good'}`}>
              {Math.floor(current.ply / 2) + 1}
              {current.color === 'w' ? '.' : '...'} {current.san}: {CLASS_LABEL[current.cls].label}
              {current.cls !== 'best' && current.bestSan ? ` — en iyisi ${current.bestSan}` : ''}
            </p>
          )}
          <div className="move-grid">
            {analysis.moves.map((m, i) => (
              <button key={i} className={`mv ${m.cls} ${i === ply ? 'cur' : ''}`} onClick={() => setPly(i)}>
                {m.color === 'w' && <span className="muted">{i / 2 + 1}.</span>}
                {m.san}
                {CLASS_LABEL[m.cls].symbol}
              </button>
            ))}
          </div>
          <div className="puzzle-actions">
            <button className="btn" onClick={() => setPly(-1)}>
              ⏮
            </button>
            <button className="btn" onClick={() => setPly((p) => Math.max(-1, p - 1))}>
              ◀
            </button>
            <button className="btn" onClick={() => setPly((p) => Math.min(sans.length - 1, p + 1))}>
              ▶
            </button>
            <button className="btn" onClick={() => setPly(sans.length - 1)}>
              ⏭
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
