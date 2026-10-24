import type { EngineLine } from './engine'

const MATE_SCORE = 100000

/** Bir motor satırını tek sayıya çevirir (sırası gelen tarafa göre, santipiyon). */
export function lineValue(l: Pick<EngineLine, 'cp' | 'mate'>): number {
  if (l.mate !== undefined) {
    if (l.mate === 0) return -MATE_SCORE
    return l.mate > 0 ? MATE_SCORE - l.mate * 100 : -MATE_SCORE - l.mate * 100
  }
  return l.cp ?? 0
}

export function isMateValue(v: number) {
  return Math.abs(v) > MATE_SCORE / 2
}

/** Kullanıcıya gösterilecek kısa değerlendirme metni, beyazın bakış açısıyla. */
export function formatEval(l: Pick<EngineLine, 'cp' | 'mate'>, turn: 'w' | 'b'): string {
  const sign = turn === 'w' ? 1 : -1
  if (l.mate !== undefined) {
    const m = l.mate * sign
    return m > 0 ? `M${m}` : `-M${-m}`
  }
  const cp = (l.cp ?? 0) * sign
  return `${cp > 0 ? '+' : ''}${(cp / 100).toFixed(1)}`
}

/** Beyazın kazanma olasılığı (0–1); değerlendirme çubuğu için. */
export function whiteWinChance(l: Pick<EngineLine, 'cp' | 'mate'>, turn: 'w' | 'b'): number {
  const v = lineValue(l) * (turn === 'w' ? 1 : -1)
  if (isMateValue(v)) return v > 0 ? 1 : 0
  return 1 / (1 + Math.exp(-0.00368208 * v))
}
