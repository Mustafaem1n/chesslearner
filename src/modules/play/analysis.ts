import { Chess } from 'chess.js'
import { getEngine } from '../../engine/engine'
import { lineValue } from '../../engine/score'

export type MoveClass = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export interface MoveAnalysis {
  ply: number
  san: string
  uci: string
  color: 'w' | 'b'
  fenBefore: string
  fenAfter: string
  best: string | null
  bestSan: string | null
  /** Hamleden sonraki değerlendirme, beyazın bakış açısıyla (santipiyon, mat = ±büyük) */
  evalAfter: number
  /** Hamleyi yapanın kazanma yüzdesindeki kayıp (0–100) */
  winLoss: number
  cls: MoveClass
  accuracy: number
}

export interface GameAnalysis {
  moves: MoveAnalysis[]
  accuracy: { w: number; b: number }
  counts: Record<'w' | 'b', Record<MoveClass, number>>
}

const clampCp = (v: number) => Math.max(-1500, Math.min(1500, v))
/** Lichess'in kullandığı kazanma yüzdesi formülü */
export const winPct = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clampCp(cp))) - 1)
const moveAccuracy = (winLoss: number) => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669))

function classify(winLoss: number, isBest: boolean): MoveClass {
  if (isBest || winLoss < 2) return 'best'
  if (winLoss >= 30) return 'blunder'
  if (winLoss >= 20) return 'mistake'
  if (winLoss >= 10) return 'inaccuracy'
  return 'good'
}

export const CLASS_LABEL: Record<MoveClass, { label: string; symbol: string }> = {
  best: { label: 'En iyi', symbol: '' },
  good: { label: 'İyi', symbol: '' },
  inaccuracy: { label: 'Yanlışlık', symbol: '?!' },
  mistake: { label: 'Hata', symbol: '?' },
  blunder: { label: 'Büyük hata', symbol: '??' },
}

/** Oyundaki her pozisyonu bir kez değerlendirir ve hamleleri sınıflandırır. */
export async function analyseGame(
  sans: string[],
  opts: { startFen?: string; depth?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<GameAnalysis> {
  const engine = getEngine()
  const chess = new Chess(opts.startFen)
  const fens = [chess.fen()]
  const played: { san: string; uci: string; color: 'w' | 'b' }[] = []
  for (const san of sans) {
    const mv = chess.move(san)
    played.push({ san: mv.san, uci: mv.from + mv.to + (mv.promotion ?? ''), color: mv.color })
    fens.push(chess.fen())
  }

  // Her pozisyonun değeri (sırası gelen tarafa göre) ve en iyi hamlesi
  const values: number[] = []
  const bests: (string | null)[] = []
  for (let i = 0; i < fens.length; i++) {
    const c = new Chess(fens[i])
    if (c.isCheckmate()) {
      values.push(-100000)
      bests.push(null)
    } else if (c.isDraw() || c.isStalemate()) {
      values.push(0)
      bests.push(null)
    } else {
      const res = await engine.analyse(fens[i], { depth: opts.depth ?? 11 })
      values.push(res.lines[0] ? lineValue(res.lines[0]) : 0)
      bests.push(res.bestMove)
    }
    opts.onProgress?.(i + 1, fens.length)
  }

  const moves: MoveAnalysis[] = played.map((m, i) => {
    const before = values[i]
    const after = -values[i + 1]
    const winLoss = Math.max(0, winPct(before) - winPct(after))
    const best = bests[i]
    const isBest = best === m.uci
    let bestSan: string | null = null
    if (best) {
      try {
        bestSan = new Chess(fens[i]).move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: best[4] }).san
      } catch {
        bestSan = null
      }
    }
    const whitePov = m.color === 'w' ? after : -after
    return {
      ply: i,
      san: m.san,
      uci: m.uci,
      color: m.color,
      fenBefore: fens[i],
      fenAfter: fens[i + 1],
      best,
      bestSan,
      evalAfter: whitePov,
      winLoss,
      cls: classify(winLoss, isBest),
      accuracy: moveAccuracy(winLoss),
    }
  })

  const empty = (): Record<MoveClass, number> => ({ best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 })
  const counts = { w: empty(), b: empty() }
  const acc = { w: [] as number[], b: [] as number[] }
  for (const m of moves) {
    counts[m.color][m.cls]++
    acc[m.color].push(m.accuracy)
  }
  const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)
  return { moves, accuracy: { w: mean(acc.w), b: mean(acc.b) }, counts }
}
