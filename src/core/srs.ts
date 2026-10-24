/** SM-2 tabanlı aralıklı tekrar. Kartlar: açılış hatları, teorik pozisyonlar, hata defteri. */

export interface SrsState {
  due: number
  /** gün */
  interval: number
  ease: number
  reps: number
  lapses: number
}

/** 0 = bilemedi, 3 = zorlanarak/ipucuyla, 4 = doğru, 5 = kolay ve hızlı */
export type Grade = 0 | 3 | 4 | 5

const DAY = 24 * 60 * 60 * 1000

export function newCard(now = Date.now()): SrsState {
  return { due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 }
}

export function review(card: SrsState, grade: Grade, now = Date.now()): SrsState {
  if (grade < 3) {
    // Yanlış: kısa süre sonra tekrar (10 dk), sonra baştan
    return {
      ...card,
      reps: 0,
      lapses: card.lapses + 1,
      interval: 0,
      ease: Math.max(1.3, card.ease - 0.2),
      due: now + 10 * 60 * 1000,
    }
  }
  const ease = Math.max(1.3, card.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)))
  const reps = card.reps + 1
  let interval: number
  if (reps === 1) interval = grade === 5 ? 2 : 1
  else if (reps === 2) interval = grade === 3 ? 3 : 6
  else interval = Math.round(card.interval * ease * (grade === 3 ? 0.8 : 1))
  return { due: now + interval * DAY, interval, ease, reps, lapses: card.lapses }
}

export function isDue(card: SrsState, now = Date.now()) {
  return card.due <= now
}

export function gradeFromResult(r: { success: boolean; hints: number; timeMs?: number }): Grade {
  if (!r.success) return 0
  if (r.hints > 0) return 3
  if (r.timeMs !== undefined && r.timeMs < 8000) return 5
  return 4
}
