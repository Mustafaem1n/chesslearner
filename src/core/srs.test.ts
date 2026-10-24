import { describe, expect, it } from 'vitest'
import { newCard, review } from './srs'

const DAY = 86400000

describe('srs', () => {
  it('doğru cevaplarla aralık büyür', () => {
    let c = newCard(0)
    c = review(c, 4, 0)
    expect(c.interval).toBe(1)
    c = review(c, 4, c.due)
    expect(c.interval).toBe(6)
    c = review(c, 4, c.due)
    expect(c.interval).toBeGreaterThanOrEqual(14)
  })
  it('yanlışta sıfırlanır ve yakında tekrar gelir', () => {
    let c = review(review(newCard(0), 5, 0), 5, 2 * DAY)
    c = review(c, 0, 10 * DAY)
    expect(c.reps).toBe(0)
    expect(c.lapses).toBe(1)
    expect(c.due - 10 * DAY).toBeLessThan(DAY)
  })
})
