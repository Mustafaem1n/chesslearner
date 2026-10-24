import { Chess } from 'chess.js'
import { useEffect, useRef, useState } from 'react'
import type { Arrow } from 'react-chessboard'
import { ChessBoard, type Highlight } from '../../board/ChessBoard'
import { parseUci, toUci, type MoveInput } from '../../board/moves'
import { playMoveSound, playSound } from '../../core/sound'
import { HINT_THEMES, themeName } from '../../data/themes'
import { bestMove } from '../../engine/opponent'
import './puzzle.css'

/**
 * Senaryolu egzersiz: kullanıcı belirli hamleleri bulmalı, rakip cevapları otomatik oynanır.
 * Bulmacalar, açılış hatları ve ders adımları bunu kullanır.
 */
export interface ScriptedExercise {
  id: string
  fen: string
  /** Başta otomatik oynanan hamleler (ör. Lichess'te rakibin son hamlesi) */
  setup?: string[]
  /** Kullanıcı, rakip, kullanıcı… sırasıyla UCI hamleler. Kullanıcı adımında alternatifler dizi olarak verilebilir. */
  solution: (string | string[])[]
  /** Mat eden her hamle doğru kabul edilir */
  acceptAnyMate?: boolean
  themes?: string[]
  /** Yanlış hamleye özel açıklama: uci → metin */
  wrongFeedback?: Record<string, string>
  /** Her doğru kullanıcı hamlesinden sonra gösterilecek açıklama (index: kullanıcı hamlesi sırası) */
  comments?: string[]
  prompt?: string
}

export interface ExerciseOutcome {
  success: boolean
  mistakes: number
  hints: number
  timeMs: number
}

interface Props {
  exercise: ScriptedExercise
  /** 'test': ilk hatada biter, ipucu yok. 'practice': hata gösterilir, tekrar denenir. */
  mode?: 'practice' | 'test'
  onComplete?: (o: ExerciseOutcome) => void
  /** Bitince altta gösterilecek eylemler (Sonraki vb.) */
  children?: React.ReactNode
  showRefutation?: boolean
  header?: React.ReactNode
  /** Görselleştirme antrenmanı için taşları gizle */
  hidePieces?: boolean
}

type Phase = 'setup' | 'user' | 'opponent' | 'wrong' | 'solved' | 'failed' | 'showing'

const alts = (step: string | string[]) => (Array.isArray(step) ? step : [step])

export function PuzzlePlayer({
  exercise,
  mode = 'practice',
  onComplete,
  children,
  showRefutation = true,
  header,
  hidePieces = false,
}: Props) {
  const [fen, setFen] = useState(exercise.fen)
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>(exercise.setup?.length ? 'setup' : 'user')
  const [message, setMessage] = useState<{ kind: 'info' | 'good' | 'bad'; text: string } | null>(
    exercise.prompt ? { kind: 'info', text: exercise.prompt } : null,
  )
  const [hintLevel, setHintLevel] = useState(0)
  const [highlights, setHighlights] = useState<Partial<Record<string, Highlight>>>({})
  const [arrows, setArrows] = useState<Arrow[]>([])
  const [userColor] = useState<'w' | 'b'>(() => {
    const chess = new Chess(exercise.fen)
    for (const m of exercise.setup ?? []) chess.move(parseUci(m))
    return chess.turn()
  })
  const mistakes = useRef(0)
  const startedAt = useRef(0)
  const finished = useRef(false)
  const timers = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  // Kurulum hamlelerini oynat. Not: üst bileşen her egzersiz için `key={exercise.id}` vermeli.
  useEffect(() => {
    const t = timers.current
    const c = new Chess(exercise.fen)
    const setup = exercise.setup ?? []
    startedAt.current = Date.now()
    setup.forEach((m, i) => {
      t.push(
        window.setTimeout(() => {
          const mv = c.move(parseUci(m))
          playMoveSound(mv)
          setFen(c.fen())
          setLastMove({ from: mv.from, to: mv.to })
          if (i === setup.length - 1) {
            setPhase('user')
            startedAt.current = Date.now()
          }
        }, 500 + i * 450),
      )
    })
    return () => {
      t.forEach(clearTimeout)
      t.length = 0
    }
  }, [exercise])

  function finish(success: boolean) {
    if (finished.current) return
    finished.current = true
    onComplete?.({
      success: success && mistakes.current === 0 && hintLevel < 3,
      mistakes: mistakes.current,
      hints: hintLevel,
      timeMs: Date.now() - startedAt.current,
    })
  }

  function playOpponent(chess: Chess, nextStep: number) {
    const reply = exercise.solution[nextStep]
    if (reply === undefined) {
      setPhase('solved')
      playSound('success')
      setMessage({ kind: 'good', text: mistakes.current ? 'Çözüldü (hatayla).' : 'Doğru! Çözüldü.' })
      finish(true)
      return
    }
    setPhase('opponent')
    later(() => {
      const mv = chess.move(parseUci(alts(reply)[0]))
      playMoveSound(mv)
      setFen(chess.fen())
      setLastMove({ from: mv.from, to: mv.to })
      setStep(nextStep + 1)
      if (nextStep + 1 >= exercise.solution.length) {
        setPhase('solved')
        playSound('success')
        finish(true)
      } else setPhase('user')
    }, 450)
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
    const uci = toUci({ from: mv.from, to: mv.to, promotion: mv.promotion as MoveInput['promotion'] })
    const expected = alts(exercise.solution[step])
    const isMate = chess.isCheckmate()
    setHighlights({})
    setArrows([])

    if (expected.includes(uci) || (exercise.acceptAnyMate && isMate)) {
      playMoveSound(mv)
      setFen(chess.fen())
      setLastMove({ from: mv.from, to: mv.to })
      const userIdx = Math.floor(step / 2)
      const comment = exercise.comments?.[userIdx]
      setMessage(comment ? { kind: 'good', text: comment } : { kind: 'good', text: 'Doğru hamle!' })
      if (isMate || step + 1 >= exercise.solution.length) {
        setPhase('solved')
        playSound('success')
        if (!comment) setMessage({ kind: 'good', text: mistakes.current ? 'Çözüldü (hatayla).' : 'Mükemmel! Çözüldü.' })
        finish(true)
      } else {
        setStep(step + 1)
        playOpponent(chess, step + 1)
      }
      return true
    }

    // Yanlış hamle
    mistakes.current++
    playSound('error')
    const before = fen
    setFen(chess.fen())
    setLastMove({ from: mv.from, to: mv.to })
    setHighlights({ [mv.to]: 'bad' })
    setPhase('wrong')
    const custom = exercise.wrongFeedback?.[uci]
    setMessage({ kind: 'bad', text: custom ?? 'Bu hamle değil.' })

    const after = (refutation?: string) => {
      if (mode === 'test') {
        later(() => {
          setFen(before)
          setLastMove(null)
          setHighlights({})
          setPhase('failed')
          finish(false)
        }, 1600)
      } else {
        later(() => {
          setFen(before)
          setLastMove(null)
          setHighlights({})
          setArrows([])
          setPhase('user')
          setMessage({ kind: 'info', text: refutation ? 'Tekrar dene.' : (custom ?? 'Tekrar dene.') })
        }, refutation ? 2200 : 1200)
      }
    }

    if (showRefutation && !chess.isGameOver()) {
      bestMove(chess.fen(), 300)
        .then((reply) => {
          if (!reply) return after()
          const r = parseUci(reply)
          const c2 = new Chess(chess.fen())
          const rm = c2.move(r)
          later(() => {
            playMoveSound(rm)
            setFen(c2.fen())
            setLastMove({ from: rm.from, to: rm.to })
            if (!custom) setMessage({ kind: 'bad', text: `Rakip ${rm.san} ile cevap verir.` })
            after(reply)
          }, 450)
        })
        .catch(() => after())
    } else after()
    return false
  }

  function showSolution() {
    const chess = new Chess(fen)
    setPhase('showing')
    setHighlights({})
    if (!finished.current) {
      mistakes.current++
      finish(false)
    }
    let i = step
    const run = () => {
      if (i >= exercise.solution.length) {
        setPhase(mode === 'test' ? 'failed' : 'solved')
        setMessage({ kind: 'info', text: 'Çözüm gösterildi.' })
        return
      }
      const mv = chess.move(parseUci(alts(exercise.solution[i])[0]))
      playMoveSound(mv)
      setFen(chess.fen())
      setLastMove({ from: mv.from, to: mv.to })
      i++
      later(run, 700)
    }
    later(run, 200)
  }

  function hint() {
    const next = hintLevel + 1
    setHintLevel(next)
    const uci = alts(exercise.solution[step])[0]
    const { from, to } = parseUci(uci)
    if (next === 1) {
      setHighlights({ [from]: 'hint' })
      setMessage({ kind: 'info', text: 'İşaretli taşla oyna.' })
    } else if (next === 2) {
      const t = exercise.themes?.find((x) => HINT_THEMES.has(x))
      setHighlights({ [from]: 'hint' })
      setMessage({ kind: 'info', text: t ? `Tema: ${themeName(t)}` : 'Zorlayıcı hamlelere bak: şah, alma, tehdit.' })
    } else {
      setArrows([{ startSquare: from, endSquare: to, color: 'rgb(80 140 230 / 0.85)' }])
      setMessage({ kind: 'info', text: 'Ok yönünde oyna.' })
    }
  }

  const done = phase === 'solved' || phase === 'failed'
  const toMove = userColor === 'w' ? 'Beyaz' : 'Siyah'

  return (
    <div className="puzzle">
      <ChessBoard
        fen={fen}
        onMove={onMove}
        orientation={userColor === 'w' ? 'white' : 'black'}
        movable={phase === 'user' ? userColor : 'none'}
        lastMove={lastMove}
        highlights={highlights}
        arrows={arrows}
        hidePieces={hidePieces && phase !== 'solved' && phase !== 'failed' && phase !== 'showing'}
      />
      <aside className="puzzle-side card">
        {header}
        <div className={`turn-badge ${userColor}`}>
          <span className="dot" /> {toMove} oynar
        </div>
        {message && <p className={`msg ${message.kind}`}>{message.text}</p>}
        {phase === 'setup' && <p className="muted">Rakip hamlesini yapıyor…</p>}
        <div className="puzzle-actions">
          {mode === 'practice' && !done && phase !== 'showing' && (
            <>
              <button className="btn" onClick={hint} disabled={phase !== 'user' || hintLevel >= 3}>
                💡 İpucu {hintLevel > 0 ? `(${hintLevel}/3)` : ''}
              </button>
              <button className="btn" onClick={showSolution} disabled={phase !== 'user'}>
                Çözümü göster
              </button>
            </>
          )}
          {phase === 'failed' && mode === 'test' && <span className="muted">Doğru hamle bulunamadı.</span>}
        </div>
        {done && children}
      </aside>
    </div>
  )
}
