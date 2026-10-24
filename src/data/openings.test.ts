import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { lineSide, OPENING_COURSES, parseLine } from './openings'

describe('açılışlar', () => {
  it('açıklamaları doğru hamleye bağlar', () => {
    const p = parseLine('e4 {merkez} e5 Nf3 {saldırı}')
    expect(p.sans).toEqual(['e4', 'e5', 'Nf3'])
    expect(p.notes).toEqual(['merkez', undefined, 'saldırı'])
  })

  for (const course of OPENING_COURSES) {
    describe(course.id, () => {
      const ids = course.lines.map((l) => l.id)
      it('benzersiz hat kimlikleri', () => expect(new Set(ids).size).toBe(ids.length))
      for (const line of course.lines) {
        it(line.id, () => {
          const { sans } = parseLine(line.pgn)
          const chess = new Chess()
          for (const san of sans) expect(() => chess.move(san), `${line.id}: ${san}`).not.toThrow()
          // Hat kullanıcının hamlesiyle bitmeli
          const side = lineSide(course, line)
          const lastByUser = (sans.length % 2 === 1) === (side === 'w')
          expect(lastByUser, `${line.id} kullanıcının hamlesiyle bitmeli`).toBe(true)
        })
      }
    })
  }
})
