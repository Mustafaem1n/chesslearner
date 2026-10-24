import type { Skill } from '../core/rating'

export interface Puzzle {
  id: string
  /** Rakibin ilk hamlesinden ÖNCEKİ pozisyon (Lichess biçimi) */
  fen: string
  /** moves[0] rakibin hamlesi, sonra sırayla kullanıcı/rakip */
  moves: string[]
  rating: number
  skill: Skill
  themes: string[]
}

interface RawData {
  themes: string[]
  skills: Skill[]
  puzzles: [string, string, string, number, number, number[]][]
}

let cache: Promise<Puzzle[]> | null = null

export function loadPuzzles(): Promise<Puzzle[]> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/puzzles.json`)
    .then((r) => {
      if (!r.ok) throw new Error('Bulmaca verisi yüklenemedi')
      return r.json() as Promise<RawData>
    })
    .then((d) =>
      d.puzzles.map(([id, fen, moves, rating, skill, themes]) => ({
        id,
        fen,
        moves: moves.split(' '),
        rating,
        skill: d.skills[skill],
        themes: themes.map((t) => d.themes[t]),
      })),
    )
  cache.catch(() => (cache = null))
  return cache
}

export interface PuzzleQuery {
  skill?: Skill
  /** Bulmaca bu temalardan en az birine sahip olmalı */
  themes?: string[]
  rating: number
  /** Hedef puan etrafındaki aralık (varsayılan ±150) */
  spread?: number
  exclude?: Iterable<string>
  /** Kullanıcı hamlesi sayısı üst sınırı */
  maxUserMoves?: number
}

/** Hedef puana en yakın, görülmemiş, rastgele bir bulmaca seçer. */
export function pickPuzzle(all: Puzzle[], q: PuzzleQuery): Puzzle | null {
  const exclude = new Set(q.exclude ?? [])
  const matches = (p: Puzzle) =>
    !exclude.has(p.id) &&
    (!q.skill || p.skill === q.skill) &&
    (!q.themes || q.themes.some((t) => p.themes.includes(t))) &&
    (!q.maxUserMoves || Math.floor(p.moves.length / 2) <= q.maxUserMoves)
  const pool = all.filter(matches)
  if (!pool.length) return null
  for (let spread = q.spread ?? 150; spread < 3000; spread *= 2) {
    const near = pool.filter((p) => Math.abs(p.rating - q.rating) <= spread)
    if (near.length >= 3 || spread > 1200) {
      const list = near.length ? near : pool
      return list[Math.floor(Math.random() * list.length)]
    }
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export function puzzleSkills(p: Puzzle): Skill[] {
  const s: Skill[] = [p.skill]
  if (p.skill !== 'tactics' && p.themes.some((t) => ['fork', 'pin', 'skewer', 'discoveredAttack', 'deflection'].includes(t)))
    s.push('tactics')
  if (p.skill !== 'calculation' && (p.themes.includes('long') || p.themes.includes('veryLong'))) s.push('calculation')
  return s
}

export function puzzleToExercise(p: Puzzle) {
  return {
    id: p.id,
    fen: p.fen,
    setup: [p.moves[0]],
    solution: p.moves.slice(1),
    acceptAnyMate: p.themes.some((t) => t.startsWith('mate') || t.endsWith('Mate')),
    themes: p.themes,
  }
}

/** Bulmaca sonucundan puan güncellemesinde kullanılan skor */
export function outcomeScore(o: { success: boolean; hints: number; mistakes: number }) {
  if (o.success) return o.hints > 0 ? 0.6 : 1
  return 0
}
