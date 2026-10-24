import type { Arrow } from 'react-chessboard'
import type { ArrowSpec } from '../data/curriculum/types'

export const ARROW_COLOR: Record<NonNullable<ArrowSpec[2]>, string> = {
  green: 'rgb(60 160 80 / 0.85)',
  red: 'rgb(220 70 60 / 0.85)',
  blue: 'rgb(60 120 220 / 0.85)',
  yellow: 'rgb(230 170 30 / 0.9)',
}

export const toArrows = (specs: ArrowSpec[] = []): Arrow[] =>
  specs.map(([from, to, color]) => ({ startSquare: from, endSquare: to, color: ARROW_COLOR[color ?? 'green'] }))
