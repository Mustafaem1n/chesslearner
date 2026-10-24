import { SKILLS, updateRating, type Rating, type Skill } from './rating'

/** Seviye testindeki bir pozisyonun türü ve ölçtüğü beceri */
export type PlacementItem =
  | { kind: 'puzzle'; skill: Skill; themes?: string[] }
  | { kind: 'halfgame' }

export const PLACEMENT_ITEMS: PlacementItem[] = [
  { kind: 'puzzle', skill: 'mates' },
  { kind: 'puzzle', skill: 'tactics' },
  { kind: 'puzzle', skill: 'tactics' },
  { kind: 'puzzle', skill: 'endgame' },
  { kind: 'puzzle', skill: 'calculation' },
  { kind: 'puzzle', skill: 'opening' },
  { kind: 'puzzle', skill: 'tactics' },
  { kind: 'puzzle', skill: 'mates' },
  // Strateji: sessiz/savunma hamlesi bulmacaları (zorlayıcı olmayan en iyi hamle)
  { kind: 'puzzle', skill: 'strategy', themes: ['quietMove', 'defensiveMove'] },
  { kind: 'puzzle', skill: 'calculation' },
  { kind: 'puzzle', skill: 'endgame' },
  { kind: 'halfgame' },
]

export const SELF_ASSESSMENT = [
  { label: 'Yeni başladım', hint: 'Taşların hareketini biliyorum', rating: 600 },
  { label: 'Biraz biliyorum', hint: 'Arkadaşlarla / internette oynuyorum', rating: 1000 },
  { label: 'Kulüp seviyesi', hint: 'Taktikleri ve temel oyunsonlarını biliyorum', rating: 1400 },
  { label: 'Turnuva oyuncusu', hint: 'Düzenli çalışıyorum, repertuvarım var', rating: 1800 },
] as const

export interface PlacementAnswer {
  skill: Skill
  rating: number
  success: boolean
  timeMs: number
}

export interface PlacementState {
  estimate: number
  step: number
  answers: PlacementAnswer[]
}

export function startPlacement(selfRating: number): PlacementState {
  return { estimate: selfRating, step: 350, answers: [] }
}

/** İkili-arama benzeri adaptif güncelleme: adım her cevapta küçülür. */
export function answerPlacement(s: PlacementState, a: PlacementAnswer): PlacementState {
  // Tahminin altında/üstünde bir soruyu çözmek daha az/çok bilgi taşır
  const surprise = a.success ? Math.max(0.4, Math.min(1.4, 1 + (a.rating - s.estimate) / 600)) : Math.max(0.4, Math.min(1.4, 1 - (a.rating - s.estimate) / 600))
  const fast = a.success && a.timeMs < 15000 ? 1.15 : 1
  const delta = s.step * surprise * fast * (a.success ? 1 : -1)
  return {
    estimate: Math.round(Math.max(200, Math.min(2700, s.estimate + delta))),
    step: Math.max(70, s.step * 0.72),
    answers: [...s.answers, a],
  }
}

/** Test bitince her beceri için başlangıç puanı üretir. */
export function finalizePlacement(s: PlacementState): Record<Skill, Rating> {
  const out = {} as Record<Skill, Rating>
  for (const skill of SKILLS) {
    let r: Rating = { r: s.estimate, rd: 220 }
    for (const a of s.answers.filter((x) => x.skill === skill)) {
      r = updateRating(r, { r: a.rating, rd: 70 }, a.success ? 1 : 0)
    }
    // Tek soruya fazla güvenme: genel tahminle harmanla
    const n = s.answers.filter((x) => x.skill === skill).length
    const w = Math.min(0.6, n * 0.3)
    out[skill] = { r: Math.round(s.estimate * (1 - w) + r.r * w), rd: n ? 160 : 200 }
  }
  return out
}

/** Yarım oyun seçimi tahmine göre */
export function halfGameForEstimate(est: number): string {
  if (est < 900) return 'eg-kqk'
  if (est < 1300) return 'eg-kp-key'
  if (est < 1700) return 'eg-lucena'
  return 'eg-philidor'
}
