import { Chess, type Move } from 'chess.js'
import { useCallback, useMemo, useState } from 'react'
import { gameStatus, type MoveInput } from './moves'

interface GameState {
  startFen?: string
  /** Oynanan hamleler (SAN). Pozisyon her render'da bunlardan türetilir. */
  sans: string[]
}

function replay({ startFen, sans }: GameState): Chess {
  const chess = new Chess(startFen)
  for (const san of sans) chess.move(san)
  return chess
}

/** chess.js'i değişmez (immutable) React durumu olarak kullanan küçük kanca. */
export function useChessGame(initialFen?: string) {
  const [state, setState] = useState<GameState>({ startFen: initialFen, sans: [] })
  const chess = useMemo(() => replay(state), [state])
  const history = chess.history({ verbose: true }) as Move[]
  const last = history.at(-1)

  const move = useCallback(
    (m: MoveInput | string): Move | null => {
      let result: Move
      try {
        result = replay(state).move(m)
      } catch {
        return null
      }
      setState((s) => ({ ...s, sans: [...s.sans, result.san] }))
      return result
    },
    [state],
  )

  const undo = useCallback(() => setState((s) => ({ ...s, sans: s.sans.slice(0, -1) })), [])
  const load = useCallback((fen?: string) => setState({ startFen: fen, sans: [] }), [])

  return {
    chess,
    fen: chess.fen(),
    turn: chess.turn(),
    history,
    lastMove: last ? { from: last.from, to: last.to } : null,
    status: gameStatus(chess),
    move,
    undo,
    load,
  }
}
