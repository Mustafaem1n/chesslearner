import { getEngine } from './engine'
import { lineValue } from './score'

/**
 * Ayarlanabilir güçte rakip. Stockfish'in en zayıf ayarı bile yeni başlayanlar için çok güçlü
 * olduğundan, düşük seviyelerde birkaç aday hamle arasından bilerek daha zayıf olanı da seçer.
 */
export interface OpponentLevel {
  id: number
  name: string
  elo: number
  depth: number
  skill: number
  multipv: number
  /** Seçimde ne kadar "hata" yapılacağı; 0 = her zaman en iyi */
  temperature: number
}

export const OPPONENT_LEVELS: OpponentLevel[] = [
  { id: 1, name: 'Acemi', elo: 400, depth: 2, skill: 0, multipv: 8, temperature: 420 },
  { id: 2, name: 'Başlangıç', elo: 700, depth: 4, skill: 0, multipv: 6, temperature: 260 },
  { id: 3, name: 'Gelişen', elo: 1000, depth: 5, skill: 2, multipv: 5, temperature: 150 },
  { id: 4, name: 'Kulüp adayı', elo: 1250, depth: 6, skill: 5, multipv: 4, temperature: 90 },
  { id: 5, name: 'Kulüp', elo: 1500, depth: 8, skill: 8, multipv: 3, temperature: 50 },
  { id: 6, name: 'Güçlü kulüp', elo: 1750, depth: 10, skill: 11, multipv: 3, temperature: 28 },
  { id: 7, name: 'İleri', elo: 2000, depth: 12, skill: 14, multipv: 2, temperature: 14 },
  { id: 8, name: 'Uzman', elo: 2300, depth: 14, skill: 18, multipv: 1, temperature: 0 },
  { id: 9, name: 'Tam güç', elo: 3000, depth: 18, skill: 20, multipv: 1, temperature: 0 },
]

export function levelForRating(rating: number): OpponentLevel {
  let best = OPPONENT_LEVELS[0]
  for (const l of OPPONENT_LEVELS) if (l.elo <= rating + 100) best = l
  return best
}

export async function pickOpponentMove(fen: string, level: OpponentLevel): Promise<string | null> {
  const engine = getEngine()
  const res = await engine.analyse(fen, { depth: level.depth, multipv: level.multipv, skill: level.skill })
  if (!res.lines.length || level.temperature === 0) return res.bestMove
  // Softmax: değeri yüksek hamle daha olası, sıcaklık arttıkça zayıf hamleler de seçilir
  const values = res.lines.map(lineValue)
  const top = Math.max(...values)
  const weights = values.map((v) => Math.exp((v - top) / level.temperature))
  const sum = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * sum
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return res.lines[i].move
  }
  return res.bestMove
}

/** Oyunsonu/yarım oyun savunması ve testler için: her zaman en iyi hamle. */
export async function bestMove(fen: string, movetime = 400): Promise<string | null> {
  const res = await getEngine().analyse(fen, { movetime, depth: 22 })
  return res.bestMove
}
