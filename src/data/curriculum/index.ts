import { STAGE0 } from './stage0'
import { STAGE1 } from './stage1'
import { STAGE2 } from './stage2'
import { STAGE3 } from './stage3'
import { STAGE4 } from './stage4'
import { STAGE5 } from './stage5'
import type { Stage, Unit } from './types'

export const CURRICULUM: Stage[] = [STAGE0, STAGE1, STAGE2, STAGE3, STAGE4, STAGE5]

export const ALL_UNITS: Unit[] = CURRICULUM.flatMap((s) => s.units)

export const unitById = (id: string) => ALL_UNITS.find((u) => u.id === id)

/** Ünitenin müfredattaki bir sonraki ünitesi */
export function nextUnit(id: string): Unit | undefined {
  const i = ALL_UNITS.findIndex((u) => u.id === id)
  return i >= 0 ? ALL_UNITS[i + 1] : undefined
}

export type { Stage, Unit, LessonStep } from './types'
