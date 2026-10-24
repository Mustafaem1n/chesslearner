import { describe, expect, it } from 'vitest'
import { expectedScore, stageForRating, updateRating } from './rating'

describe('glicko', () => {
  it('eşit puanda beklenti 0.5', () => {
    expect(expectedScore({ r: 1500, rd: 100 }, { r: 1500, rd: 100 })).toBeCloseTo(0.5)
  })
  it('kazanınca artar, kaybedince azalır, RD küçülür', () => {
    const p = { r: 1200, rd: 300 }
    const win = updateRating(p, { r: 1400, rd: 70 }, 1)
    const loss = updateRating(p, { r: 1400, rd: 70 }, 0)
    expect(win.r).toBeGreaterThan(1200)
    expect(loss.r).toBeLessThan(1200)
    expect(win.rd).toBeLessThan(300)
  })
  it('yüksek RD ile büyük adımlar atar', () => {
    const fresh = updateRating({ r: 1000, rd: 350 }, { r: 1600, rd: 70 }, 1)
    const settled = updateRating({ r: 1000, rd: 60 }, { r: 1600, rd: 70 }, 1)
    expect(fresh.r - 1000).toBeGreaterThan(settled.r - 1000)
  })
  it('aşamayı bulur', () => {
    expect(stageForRating(350)).toBe(0)
    expect(stageForRating(1250)).toBe(3)
    expect(stageForRating(2400)).toBe(5)
  })
})
