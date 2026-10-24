import { Chess, type Square } from 'chess.js'

export type Color = 'w' | 'b'
export type Promotion = 'q' | 'r' | 'b' | 'n'

export interface MoveInput {
  from: Square
  to: Square
  promotion?: Promotion
}

/** "e7e8q" → { from: 'e7', to: 'e8', promotion: 'q' } */
export function parseUci(uci: string): MoveInput {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
    throw new Error(`Geçersiz UCI hamlesi: ${uci}`)
  }
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: (uci[4] as Promotion | undefined) ?? undefined,
  }
}

export function toUci(m: MoveInput): string {
  return `${m.from}${m.to}${m.promotion ?? ''}`
}

/** Hamle bir piyon terfisi mi? (yasal olup olmadığına bakılmaksızın) */
export function isPromotionMove(fen: string, from: Square, to: Square): boolean {
  const chess = new Chess(fen)
  const piece = chess.get(from)
  if (!piece || piece.type !== 'p') return false
  return (piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1')
}

/** Şah çekilen tarafın şah karesi (şah yoksa null) */
export function checkedKingSquare(chess: Chess): Square | null {
  if (!chess.isCheck()) return null
  const turn = chess.turn()
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === turn) return cell.square
    }
  }
  return null
}

export type GameStatus =
  | { kind: 'playing'; turn: Color; check: boolean }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'draw'; reason: 'repetition' | 'insufficient' | 'fifty-move' }

export function gameStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return { kind: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' }
  if (chess.isStalemate()) return { kind: 'stalemate' }
  if (chess.isInsufficientMaterial()) return { kind: 'draw', reason: 'insufficient' }
  if (chess.isThreefoldRepetition()) return { kind: 'draw', reason: 'repetition' }
  if (chess.isDraw()) return { kind: 'draw', reason: 'fifty-move' }
  return { kind: 'playing', turn: chess.turn(), check: chess.isCheck() }
}

export function statusText(s: GameStatus): string {
  switch (s.kind) {
    case 'checkmate':
      return `Mat! ${s.winner === 'w' ? 'Beyaz' : 'Siyah'} kazandı.`
    case 'stalemate':
      return 'Pat — berabere.'
    case 'draw':
      return {
        repetition: 'Üçlü tekrar — berabere.',
        insufficient: 'Yetersiz materyal — berabere.',
        'fifty-move': '50 hamle kuralı — berabere.',
      }[s.reason]
    case 'playing':
      return `${s.turn === 'w' ? 'Beyaz' : 'Siyah'} oynar${s.check ? ' — şah!' : ''}`
  }
}
