import { Chess } from 'chess.js'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseUci } from '../../board/moves'
import { minStarMoves } from '../../core/stars'
import { endgameById } from '../endgames'
import { THEME_TR } from '../themes'
import { ALL_UNITS, CURRICULUM } from './index'
import { positionFen } from './resolve'

const SQUARE = /^[a-h][1-8]$/
const puzzles = JSON.parse(readFileSync(new URL('../../../public/data/puzzles.json', import.meta.url), 'utf8')) as {
  themes: string[]
  skills: string[]
  puzzles: [string, string, string, number, number, number[]][]
}

function countPuzzles(themes: string[] | undefined, skill: string | undefined) {
  return puzzles.puzzles.filter(
    (p) =>
      (!skill || puzzles.skills[p[4]] === skill) &&
      (!themes || p[5].some((t) => themes.includes(puzzles.themes[t]))),
  ).length
}

describe('müfredat', () => {
  it('benzersiz ünite kimlikleri', () => {
    const ids = ALL_UNITS.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
    CURRICULUM.forEach((s, i) => s.units.forEach((u) => expect(u.stage).toBe(i)))
  })

  for (const unit of ALL_UNITS) {
    describe(unit.id, () => {
      unit.steps.forEach((step, i) => {
        it(`adım ${i + 1} (${step.type})`, () => {
          switch (step.type) {
            case 'text': {
              const fen = positionFen(step)
              for (const m of step.marks ?? []) expect(m).toMatch(SQUARE)
              for (const [a, b] of step.arrows ?? []) {
                expect(a).toMatch(SQUARE)
                expect(b).toMatch(SQUARE)
              }
              expect(fen.split(' ')[0].split('/')).toHaveLength(8)
              break
            }
            case 'move': {
              const chess = new Chess(positionFen(step))
              for (const m of step.setup ?? []) chess.move(parseUci(m))
              const startFen = chess.fen()
              for (const key of Object.keys(step.wrongFeedback ?? {})) {
                expect(() => new Chess(startFen).move(parseUci(key)), `yanlış hamle ${key} yasal olmalı`).not.toThrow()
              }
              step.solution.forEach((s, k) => {
                const alts = Array.isArray(s) ? s : [s]
                for (const alt of alts) {
                  expect(() => new Chess(chess.fen()).move(parseUci(alt)), `${alt} yasal olmalı`).not.toThrow()
                }
                chess.move(parseUci(alts[0]))
                if (k === step.solution.length - 1 && step.acceptAnyMate) {
                  expect(chess.isCheckmate(), 'son hamle mat olmalı').toBe(true)
                }
              })
              break
            }
            case 'plan': {
              const chess = new Chess(positionFen(step))
              for (const g of step.good) expect(() => new Chess(chess.fen()).move(parseUci(g))).not.toThrow()
              break
            }
            case 'stars': {
              expect(step.start).toMatch(SQUARE)
              const min = minStarMoves(step.piece, step.start, step.stars)
              expect(min, 'yıldızlara ulaşılabilmeli').toBeLessThan(Infinity)
              expect(step.par, `par (${step.par}) en az ${min} olmalı`).toBeGreaterThanOrEqual(min)
              break
            }
            case 'halfgame':
              expect(endgameById(step.endgameId)).toBeDefined()
              break
            case 'puzzles':
              for (const t of step.themes ?? []) expect(THEME_TR[t], t).toBeDefined()
              expect(countPuzzles(step.themes, step.skill)).toBeGreaterThanOrEqual(step.count * 3)
              break
          }
        })
      })
      if (unit.exam) {
        it('sınav', () => {
          for (const t of unit.exam!.themes ?? []) expect(THEME_TR[t], t).toBeDefined()
          expect(countPuzzles(unit.exam!.themes, unit.exam!.skill)).toBeGreaterThanOrEqual(unit.exam!.count * 3)
        })
      }
    })
  }
})
