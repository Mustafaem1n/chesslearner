/** "Yıldız topla" mini oyunu için tek taşın boş tahtadaki hareketleri */
export type StarPiece = 'R' | 'B' | 'Q' | 'K' | 'N' | 'P'

const DIRS: Record<'R' | 'B', [number, number][]> = {
  R: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
  B: [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
}

const sq = (f: number, r: number) => `${'abcdefgh'[f]}${r + 1}`
const inside = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8

export function pieceTargets(piece: StarPiece, from: string): string[] {
  const f = from.charCodeAt(0) - 97
  const r = Number(from[1]) - 1
  const out: string[] = []
  const slide = (dirs: [number, number][]) => {
    for (const [df, dr] of dirs) {
      for (let i = 1; inside(f + df * i, r + dr * i); i++) out.push(sq(f + df * i, r + dr * i))
    }
  }
  switch (piece) {
    case 'R':
      slide(DIRS.R)
      break
    case 'B':
      slide(DIRS.B)
      break
    case 'Q':
      slide([...DIRS.R, ...DIRS.B])
      break
    case 'K':
      for (const [df, dr] of [...DIRS.R, ...DIRS.B]) if (inside(f + df, r + dr)) out.push(sq(f + df, r + dr))
      break
    case 'N':
      for (const [df, dr] of [
        [1, 2],
        [2, 1],
        [2, -1],
        [1, -2],
        [-1, -2],
        [-2, -1],
        [-2, 1],
        [-1, 2],
      ])
        if (inside(f + df, r + dr)) out.push(sq(f + df, r + dr))
      break
    case 'P':
      if (r < 7) out.push(sq(f, r + 1))
      if (r === 1) out.push(sq(f, r + 2))
      break
  }
  return out
}

/** Tüm yıldızları toplamak için gereken en az hamle (BFS, yıldız alt kümeleri üzerinde) */
export function minStarMoves(piece: StarPiece, start: string, stars: string[]): number {
  const full = (1 << stars.length) - 1
  const key = (s: string, m: number) => `${s}|${m}`
  const maskAt = (s: string, m: number) => {
    const i = stars.indexOf(s)
    return i >= 0 ? m | (1 << i) : m
  }
  let frontier = [[start, maskAt(start, 0)] as const]
  const seen = new Set([key(start, frontier[0][1])])
  for (let d = 0; frontier.length; d++) {
    const next: (readonly [string, number])[] = []
    for (const [s, m] of frontier) {
      if (m === full) return d
      for (const t of pieceTargets(piece, s)) {
        const nm = maskAt(t, m)
        const k = key(t, nm)
        if (!seen.has(k)) {
          seen.add(k)
          next.push([t, nm])
        }
      }
    }
    frontier = next
  }
  return Infinity
}

export function starsFen(piece: StarPiece, at: string): string {
  const rows: string[] = []
  for (let r = 7; r >= 0; r--) {
    let row = ''
    let empty = 0
    for (let f = 0; f < 8; f++) {
      if (sq(f, r) === at) {
        if (empty) row += empty
        empty = 0
        row += piece
      } else empty++
    }
    if (empty) row += empty
    rows.push(row)
  }
  return `${rows.join('/')} w - - 0 1`
}
