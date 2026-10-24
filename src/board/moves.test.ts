import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { checkedKingSquare, gameStatus, isPromotionMove, parseUci, toUci } from './moves'

describe('uci', () => {
  it('ayrıştırır ve geri yazar', () => {
    expect(parseUci('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' })
    expect(parseUci('g1f3')).toEqual({ from: 'g1', to: 'f3', promotion: undefined })
    expect(toUci(parseUci('a2a1n'))).toBe('a2a1n')
  })
  it('geçersiz hamleyi reddeder', () => {
    expect(() => parseUci('e9e4')).toThrow()
  })
})

describe('durum', () => {
  it('terfiyi tanır', () => {
    const fen = '8/4P3/8/8/8/8/k7/4K3 w - - 0 1'
    expect(isPromotionMove(fen, 'e7', 'e8')).toBe(true)
    expect(isPromotionMove(fen, 'e1', 'e2')).toBe(false)
  })
  it('matı ve şah karesini bulur', () => {
    const chess = new Chess()
    for (const m of ['f3', 'e5', 'g4', 'Qh4#']) chess.move(m)
    expect(gameStatus(chess)).toEqual({ kind: 'checkmate', winner: 'b' })
    expect(checkedKingSquare(chess)).toBe('e1')
  })
  it('patı bulur', () => {
    expect(gameStatus(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')).kind).toBe('stalemate')
  })
})
