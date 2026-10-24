import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { CLASSIC_GAMES } from './games'

describe('klasik oyunlar', () => {
  for (const g of CLASSIC_GAMES) {
    it(g.id, () => {
      const chess = new Chess()
      for (const san of g.pgn.split(' ')) expect(() => chess.move(san), `${g.id}: ${san}`).not.toThrow()
      expect(chess.isCheckmate()).toBe(true)
    })
  }
})
