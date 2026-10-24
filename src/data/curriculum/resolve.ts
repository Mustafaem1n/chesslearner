import { Chess } from 'chess.js'
import type { PositionSpec } from './types'

/** Ders adımındaki pozisyonu FEN'e çevirir (hamle listesi verildiyse başlangıçtan oynar). */
export function positionFen(spec: PositionSpec): string {
  if (spec.fen) return spec.fen
  const chess = new Chess()
  for (const san of (spec.moves ?? '').split(/\s+/).filter(Boolean)) chess.move(san)
  return chess.fen()
}

/** Hamle listesinin son hamlesi (tahtada vurgulamak için) */
export function lastMoveOf(spec: PositionSpec): { from: string; to: string } | null {
  if (spec.fen || !spec.moves?.trim()) return null
  const chess = new Chess()
  for (const san of spec.moves.split(/\s+/).filter(Boolean)) chess.move(san)
  const last = chess.history({ verbose: true }).at(-1)
  return last ? { from: last.from, to: last.to } : null
}
