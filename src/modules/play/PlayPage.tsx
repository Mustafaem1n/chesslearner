import { Chess } from 'chess.js'
import { useCallback, useEffect, useState } from 'react'
import { ChessBoard } from '../../board/ChessBoard'
import { gameStatus, parseUci, statusText, type MoveInput } from '../../board/moves'
import { overallRating } from '../../core/rating'
import { playMoveSound, playSound } from '../../core/sound'
import { getProfile, markDailyTask, updateProfile } from '../../core/store'
import { getEngine } from '../../engine/engine'
import { levelForRating, OPPONENT_LEVELS, pickOpponentMove, type OpponentLevel } from '../../engine/opponent'
import { AnalysisView } from './AnalysisView'
import type { GameAnalysis } from './analysis'
import '../puzzle/puzzle.css'
import './play.css'

type Setup = { level: OpponentLevel; color: 'w' | 'b' }

const newGameId = () => `game-${Date.now()}`

export function PlayPage() {
  const [setup, setSetup] = useState<Setup | null>(null)
  const [game, setGame] = useState(0)
  if (!setup) return <PlaySetup onStart={(s) => setSetup(s)} />
  return <Game key={game} setup={setup} onNew={() => setSetup(null)} onRematch={() => setGame((g) => g + 1)} />
}

function PlaySetup({ onStart }: { onStart: (s: Setup) => void }) {
  const [level, setLevel] = useState(() => levelForRating(overallRating(getProfile().ratings)))
  const [color, setColor] = useState<'w' | 'b' | 'random'>('w')
  return (
    <div className="play-setup">
      <h1>Motora karşı oyna</h1>
      <p className="muted" style={{ margin: 0 }}>
        Öğrendiklerini gerçek bir oyunda uygula. Oyun bitince her hamlen analiz edilir; hataların hata defterine girer.
      </p>
      <h3>Rakip seviyesi</h3>
      <div className="level-grid">
        {OPPONENT_LEVELS.map((l) => (
          <button key={l.id} className={`level-card ${l.id === level.id ? 'on' : ''}`} onClick={() => setLevel(l)}>
            <b>{l.name}</b>
            <span className="muted small">~{l.elo}</span>
          </button>
        ))}
      </div>
      <h3>Renk</h3>
      <div className="color-pick seg">
        {(
          [
            ['w', 'Beyaz'],
            ['random', 'Rastgele'],
            ['b', 'Siyah'],
          ] as const
        ).map(([c, label]) => (
          <button key={c} className={color === c ? 'on' : ''} onClick={() => setColor(c)}>
            {label}
          </button>
        ))}
      </div>
      <div>
        <button
          className="btn primary"
          onClick={() => onStart({ level, color: color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : color })}
        >
          Oyunu başlat
        </button>
      </div>
    </div>
  )
}

function Game({ setup, onNew, onRematch }: { setup: Setup; onNew: () => void; onRematch: () => void }) {
  const [sans, setSans] = useState<string[]>([])
  const [thinking, setThinking] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [analyse, setAnalyse] = useState(false)
  const [gameId] = useState(newGameId)
  const saveAnalysis = useAnalysisSaver(gameId)
  const chess = new Chess()
  for (const s of sans) chess.move(s)
  const fen = chess.fen()
  const history = chess.history({ verbose: true })
  const last = history.at(-1)
  const status = gameStatus(chess)
  const userTurn = chess.turn() === setup.color && !result

  const finish = useCallback(
    (res: string, finalSans: string[]) => {
      setResult(res)
      playSound('notify')
      markDailyTask('play')
      const c = new Chess()
      for (const s of finalSans) c.move(s)
      c.setHeader('White', setup.color === 'w' ? 'Sen' : `Motor (${setup.level.name})`)
      c.setHeader('Black', setup.color === 'b' ? 'Sen' : `Motor (${setup.level.name})`)
      c.setHeader('Result', res)
      const pgn = c.pgn()
      updateProfile((p) => {
        p.games = [
          { id: gameId, date: Date.now(), pgn, result: res, userColor: setup.color, opponent: setup.level.name },
          ...p.games,
        ].slice(0, 50)
      })
    },
    [setup, gameId],
  )

  // Motorun sırası
  useEffect(() => {
    if (result || chess.turn() === setup.color || status.kind !== 'playing') return
    let cancelled = false
    setThinking(true)
    void pickOpponentMove(fen, setup.level).then((uci) => {
      if (cancelled || !uci) return
      const c = new Chess(fen)
      const mv = c.move(parseUci(uci))
      playMoveSound(mv)
      setThinking(false)
      const next = [...sans, mv.san]
      setSans(next)
      const st = gameStatus(c)
      if (st.kind !== 'playing') finish(resultOf(st), next)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sans, result])

  useEffect(() => {
    getEngine().newGame()
  }, [])

  function resultOf(st: ReturnType<typeof gameStatus>): string {
    if (st.kind === 'checkmate') return st.winner === 'w' ? '1-0' : '0-1'
    return '1/2-1/2'
  }

  function onMove(m: MoveInput): boolean {
    if (!userTurn || thinking) return false
    const c = new Chess(fen)
    let mv
    try {
      mv = c.move(m)
    } catch {
      return false
    }
    playMoveSound(mv)
    const next = [...sans, mv.san]
    setSans(next)
    const st = gameStatus(c)
    if (st.kind !== 'playing') finish(resultOf(st), next)
    return true
  }

  function takeback() {
    // Kullanıcının son hamlesini ve motorun cevabını geri al
    const n = chess.turn() === setup.color ? 2 : 1
    setSans((s) => s.slice(0, Math.max(0, s.length - n)))
  }

  const pairs: string[] = []
  sans.forEach((s, i) => (i % 2 === 0 ? pairs.push(`${i / 2 + 1}. ${s}`) : (pairs[pairs.length - 1] += ` ${s}`)))
  const outcome =
    result &&
    (result === '1/2-1/2'
      ? 'Berabere'
      : (result === '1-0') === (setup.color === 'w')
        ? 'Kazandın! 🎉'
        : 'Kaybettin — analizden öğren.')

  if (analyse) {
    return (
      <div>
        <div className="page-head">
          <h1>Oyun analizi</h1>
          <div className="puzzle-actions">
            <button className="btn primary" onClick={onRematch}>
              Rövanş
            </button>
            <button className="btn" onClick={onNew}>
              Yeni oyun
            </button>
          </div>
        </div>
        <AnalysisView
          sans={sans}
          userColor={setup.color}
          onAnalysed={saveAnalysis}
        />
      </div>
    )
  }

  return (
    <div className="puzzle">
      <ChessBoard
        fen={fen}
        onMove={onMove}
        orientation={setup.color === 'w' ? 'white' : 'black'}
        movable={userTurn && !thinking ? setup.color : 'none'}
        lastMove={last ? { from: last.from, to: last.to } : null}
      />
      <aside className="puzzle-side card">
        <div>
          <b>Rakip: {setup.level.name}</b> <span className="muted small">(~{setup.level.elo})</span>
        </div>
        <p className="status" style={{ margin: 0, fontWeight: 600 }}>
          {result ? outcome : thinking ? 'Rakip düşünüyor…' : statusText(status)}
        </p>
        <div className="game-moves">{pairs.join('  ') || <span className="muted">Henüz hamle yok.</span>}</div>
        {!result ? (
          <div className="puzzle-actions">
            <button className="btn" onClick={takeback} disabled={thinking || sans.length < 1}>
              ↶ Geri al
            </button>
            <button
              className="btn"
              onClick={() => finish(setup.color === 'w' ? '0-1' : '1-0', sans)}
              disabled={sans.length < 2}
            >
              🏳 Terk et
            </button>
          </div>
        ) : (
          <div className="puzzle-actions">
            <button className="btn primary" onClick={() => setAnalyse(true)}>
              Oyunu analiz et
            </button>
            <button className="btn" onClick={onRematch}>
              Rövanş
            </button>
            <button className="btn" onClick={onNew}>
              Yeni oyun
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

/** Analiz sonucunu oyun kaydına işleyen sabit geri çağırma */
function useAnalysisSaver(id: string) {
  return useCallback(
    (a: GameAnalysis) => {
      updateProfile((p) => {
        const g = p.games.find((x) => x.id === id)
        if (!g) return
        g.accuracy = a.accuracy[g.userColor]
        g.blunders = a.counts[g.userColor].blunder
      })
    },
    [id],
  )
}
