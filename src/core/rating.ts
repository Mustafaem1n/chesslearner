/** Glicko-1 tabanlı puanlama. Hem kullanıcı hem egzersizler bir puana sahiptir. */

export interface Rating {
  r: number
  rd: number
}

export const SKILLS = ['tactics', 'mates', 'calculation', 'endgame', 'opening', 'strategy'] as const
export type Skill = (typeof SKILLS)[number]

export const SKILL_LABEL: Record<Skill, string> = {
  tactics: 'Taktik',
  mates: 'Mat kalıpları',
  calculation: 'Hesaplama',
  endgame: 'Oyunsonu',
  opening: 'Açılış',
  strategy: 'Strateji',
}

const SKILL_WEIGHT: Record<Skill, number> = {
  tactics: 0.25,
  mates: 0.15,
  calculation: 0.15,
  endgame: 0.2,
  opening: 0.1,
  strategy: 0.15,
}

const Q = Math.LN10 / 400
const MIN_RD = 45
const MAX_RD = 350

const g = (rd: number) => 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI))

export function expectedScore(player: Rating, opponent: Rating): number {
  return 1 / (1 + 10 ** ((-g(opponent.rd) * (player.r - opponent.r)) / 400))
}

/**
 * Tek bir sonuçtan sonra puanı günceller.
 * @param score 1 = başarı, 0 = başarısız, arası = kısmi (ör. ipucuyla)
 */
export function updateRating(player: Rating, opponent: Rating, score: number): Rating {
  const gj = g(opponent.rd)
  const e = expectedScore(player, opponent)
  const d2 = 1 / (Q * Q * gj * gj * e * (1 - e))
  const denom = 1 / (player.rd * player.rd) + 1 / d2
  const r = player.r + (Q / denom) * gj * (score - e)
  const rd = Math.sqrt(1 / denom)
  return { r: Math.round(Math.max(100, Math.min(3200, r))), rd: Math.max(MIN_RD, Math.min(MAX_RD, rd)) }
}

/** Uzun süre çalışılmayınca belirsizlik artar. */
export function decayRd(rating: Rating, daysIdle: number): Rating {
  const c = 12
  return { ...rating, rd: Math.min(MAX_RD, Math.sqrt(rating.rd ** 2 + c * c * daysIdle)) }
}

export function overallRating(ratings: Record<Skill, Rating>): number {
  let sum = 0
  for (const s of SKILLS) sum += ratings[s].r * SKILL_WEIGHT[s]
  return Math.round(sum)
}

export const STAGES = [
  { id: 0, name: 'Temeller', min: 0, max: 400 },
  { id: 1, name: 'Başlangıç', min: 400, max: 800 },
  { id: 2, name: 'Kulüp adayı', min: 800, max: 1200 },
  { id: 3, name: 'Kulüp oyuncusu', min: 1200, max: 1600 },
  { id: 4, name: 'İleri', min: 1600, max: 2000 },
  { id: 5, name: 'Uzman', min: 2000, max: 3200 },
] as const

export function stageForRating(r: number): number {
  for (let i = STAGES.length - 1; i >= 0; i--) if (r >= STAGES[i].min) return i
  return 0
}

/** Bir egzersizin varsayılan belirsizliği */
export const EXERCISE_RD = 70
