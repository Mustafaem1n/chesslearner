import { useSyncExternalStore } from 'react'
import { decayRd, overallRating, SKILLS, updateRating, EXERCISE_RD, type Rating, type Skill } from './rating'
import { newCard, review, type Grade, type SrsState } from './srs'

/** Hata defterine giren bir pozisyon */
export interface Mistake {
  id: string
  /** 'puzzle' = veritabanı bulmacası, 'position' = kendi oyunundan/derslerden tek hamlelik pozisyon */
  kind: 'puzzle' | 'position'
  puzzleId?: string
  fen?: string
  /** Pozisyonda beklenen en iyi hamle(ler), UCI */
  best?: string[]
  note?: string
  added: number
  card: SrsState
}

export interface UnitProgress {
  done: boolean
  /** Ünite sınavında alınan en iyi yüzde */
  best?: number
  step?: number
}

export interface GameRecord {
  id: string
  date: number
  pgn: string
  result: string
  userColor: 'w' | 'b'
  opponent: string
  accuracy?: number
  blunders?: number
}

export interface Profile {
  version: 1
  createdAt: number
  placementDone: boolean
  ratings: Record<Skill, Rating>
  ratingHistory: { t: number; r: number }[]
  units: Record<string, UnitProgress>
  /** Son görülen bulmacalar (tekrar gelmemesi için) */
  seen: string[]
  mistakes: Record<string, Mistake>
  srs: Record<string, SrsState>
  stats: { solved: number; failed: number; activeDays: string[]; rushBest: Record<string, number> }
  daily: { date: string; done: string[] }
  games: GameRecord[]
  settings: { sound: boolean; dailyMinutes: 15 | 30 | 45; boardTheme: 'wood' | 'green' | 'blue' }
  lastActive: number
}

const KEY = 'satranc-ogretici:v1'

export function defaultProfile(baseRating = 800): Profile {
  const ratings = Object.fromEntries(SKILLS.map((s) => [s, { r: baseRating, rd: 350 }])) as Record<Skill, Rating>
  return {
    version: 1,
    createdAt: Date.now(),
    placementDone: false,
    ratings,
    ratingHistory: [],
    units: {},
    seen: [],
    mistakes: {},
    srs: {},
    stats: { solved: 0, failed: 0, activeDays: [], rushBest: {} },
    daily: { date: '', done: [] },
    games: [],
    settings: { sound: true, dailyMinutes: 30, boardTheme: 'wood' },
    lastActive: Date.now(),
  }
}

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = { ...defaultProfile(), ...JSON.parse(raw) } as Profile
      // Uzun aradan sonra puan belirsizliği artar
      const days = (Date.now() - p.lastActive) / 86400000
      if (days > 2) for (const s of SKILLS) p.ratings[s] = decayRd(p.ratings[s], days)
      return p
    }
  } catch {
    /* bozuk kayıt: sıfırdan başla */
  }
  return defaultProfile()
}

let profile: Profile = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    /* depolama dolu ya da kapalı: oturum içinde çalışmaya devam */
  }
}

export function getProfile() {
  return profile
}

/** Profili değiştirir; `fn` bir kopya üzerinde çalışır. */
export function updateProfile(fn: (draft: Profile) => void) {
  const draft = structuredClone(profile)
  fn(draft)
  draft.lastActive = Date.now()
  const today = todayKey()
  if (!draft.stats.activeDays.includes(today)) draft.stats.activeDays = [...draft.stats.activeDays, today].slice(-400)
  profile = draft
  persist()
  for (const l of listeners) l()
}

export function resetProfile() {
  profile = defaultProfile()
  persist()
  for (const l of listeners) l()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, getProfile)
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function streak(p: Profile): number {
  const days = new Set(p.stats.activeDays)
  let n = 0
  const d = new Date()
  if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1)
  while (days.has(todayKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

// ---- Sık kullanılan güncellemeler ----

export interface ExerciseResult {
  id: string
  skills: Skill[]
  rating: number
  /** 0–1 */
  score: number
}

/** Bir egzersiz sonucunu ilgili beceri puanlarına işler; puan değişimlerini döndürür. */
export function recordResult(res: ExerciseResult): Partial<Record<Skill, number>> {
  const deltas: Partial<Record<Skill, number>> = {}
  updateProfile((p) => {
    for (const s of res.skills) {
      const before = p.ratings[s]
      const after = updateRating(before, { r: res.rating, rd: EXERCISE_RD }, res.score)
      // İkincil beceriler daha az etkilenir
      const weight = s === res.skills[0] ? 1 : 0.5
      const r = Math.round(before.r + (after.r - before.r) * weight)
      p.ratings[s] = { r, rd: before.rd + (after.rd - before.rd) * weight }
      deltas[s] = r - before.r
    }
    if (res.score >= 0.99) p.stats.solved++
    else if (res.score <= 0.01) p.stats.failed++
    p.seen = [...p.seen.filter((x) => x !== res.id), res.id].slice(-3000)
    const overall = overallRating(p.ratings)
    const last = p.ratingHistory.at(-1)
    if (!last || Date.now() - last.t > 10 * 60 * 1000) p.ratingHistory.push({ t: Date.now(), r: overall })
    else last.r = overall
  })
  return deltas
}

export function addMistake(m: Omit<Mistake, 'added' | 'card'>) {
  updateProfile((p) => {
    if (p.mistakes[m.id]) {
      p.mistakes[m.id].card = review(p.mistakes[m.id].card, 0)
      return
    }
    const card = newCard()
    card.due = Date.now() + 20 * 60 * 1000
    p.mistakes[m.id] = { ...m, added: Date.now(), card }
  })
}

export function reviewMistake(id: string, grade: Grade) {
  updateProfile((p) => {
    const m = p.mistakes[id]
    if (!m) return
    m.card = review(m.card, grade)
    // Üç kez üst üste doğru çözülen hata defterden çıkar
    if (m.card.reps >= 3) delete p.mistakes[id]
  })
}

export function reviewCard(id: string, grade: Grade) {
  updateProfile((p) => {
    p.srs[id] = review(p.srs[id] ?? newCard(), grade)
  })
}

export function markDailyTask(task: string) {
  updateProfile((p) => {
    const today = todayKey()
    if (p.daily.date !== today) p.daily = { date: today, done: [] }
    if (!p.daily.done.includes(task)) p.daily.done.push(task)
  })
}
