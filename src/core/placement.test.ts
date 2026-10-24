import { describe, expect, it } from 'vitest'
import { answerPlacement, finalizePlacement, PLACEMENT_ITEMS, startPlacement } from './placement'

function run(self: number, solveBelow: number) {
  let s = startPlacement(self)
  for (const item of PLACEMENT_ITEMS) {
    const skill = item.kind === 'puzzle' ? item.skill : 'endgame'
    const rating = s.estimate
    s = answerPlacement(s, { skill, rating, success: rating < solveBelow, timeMs: 30000 })
  }
  return s
}

describe('seviye testi', () => {
  it('gerçek seviyeye yakınsar (yukarıdan ve aşağıdan)', () => {
    for (const truth of [700, 1200, 1700, 2200]) {
      for (const self of [600, 1000, 1400, 1800]) {
        const s = run(self, truth)
        expect(Math.abs(s.estimate - truth)).toBeLessThan(250)
      }
    }
  })
  it('beceri puanlarını üretir', () => {
    const s = run(1000, 1300)
    const r = finalizePlacement(s)
    expect(Object.keys(r)).toHaveLength(6)
    for (const v of Object.values(r)) expect(Math.abs(v.r - s.estimate)).toBeLessThan(400)
  })
})
