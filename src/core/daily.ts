import { endgameCardId, ENDGAMES } from '../data/endgames'
import { ALL_UNITS } from '../data/curriculum'
import { lineCardId, OPENING_COURSES } from '../data/openings'
import { overallRating, SKILL_LABEL, SKILLS, stageForRating, type Skill } from './rating'
import { isDue } from './srs'
import { todayKey, type Profile } from './store'

export interface DailyTask {
  id: string
  title: string
  detail: string
  href: string
  minutes: number
}

export function dueCounts(p: Profile, now = Date.now()) {
  const mistakes = Object.values(p.mistakes).filter((m) => m.card.due <= now).length
  let openings = 0
  for (const c of OPENING_COURSES)
    for (const l of c.lines) {
      const card = p.srs[lineCardId(c, l)]
      if (card && isDue(card, now)) openings++
    }
  const endgames = ENDGAMES.filter((e) => {
    const card = p.srs[endgameCardId(e.id)]
    return card && isDue(card, now)
  }).length
  return { mistakes, openings, endgames, total: mistakes + openings + endgames }
}

export function weakestSkill(p: Profile): Skill {
  return [...SKILLS].filter((s) => s !== 'strategy').sort((a, b) => p.ratings[a].r - p.ratings[b].r)[0]
}

/** Önerilen bir sonraki ünite: seviyendeki ilk bitmemiş ünite, yoksa müfredattaki ilk bitmemiş */
export function nextRecommendedUnit(p: Profile) {
  const stage = p.placementDone ? stageForRating(overallRating(p.ratings)) : 0
  return (
    ALL_UNITS.find((u) => u.stage === stage && !p.units[u.id]?.done) ??
    ALL_UNITS.find((u) => u.stage >= stage && !p.units[u.id]?.done) ??
    ALL_UNITS.find((u) => !p.units[u.id]?.done)
  )
}

/** Günün planı: süre seçimine göre ısınma, tekrar, yeni konu, zayıf alan ve uygulama */
export function dailyPlan(p: Profile): DailyTask[] {
  const minutes = p.settings.dailyMinutes
  const due = dueCounts(p)
  const unit = nextRecommendedUnit(p)
  const weak = weakestSkill(p)
  const tasks: DailyTask[] = [
    { id: 'warmup', title: 'Isınma', detail: '5 hızlı taktik bulmacası', href: '#/daily/warmup', minutes: 4 },
  ]
  if (due.total > 0) {
    const parts = [
      due.mistakes && `${due.mistakes} hata`,
      due.openings && `${due.openings} açılış hattı`,
      due.endgames && `${due.endgames} oyunsonu`,
    ].filter(Boolean)
    tasks.push({ id: 'review', title: 'Tekrar', detail: parts.join(', '), href: '#/review', minutes: 6 })
  }
  if (unit) tasks.push({ id: 'lesson', title: 'Yeni konu', detail: unit.title, href: `#/unit/${unit.id}`, minutes: 8 })
  if (minutes >= 30) {
    tasks.push({
      id: 'weak',
      title: 'Zayıf alan',
      detail: `${SKILL_LABEL[weak]}: 6 bulmaca`,
      href: '#/daily/weak',
      minutes: 6,
    })
    tasks.push({ id: 'play', title: 'Uygulama', detail: 'Seviyene uygun rakibe karşı bir oyun', href: '#/play', minutes: 10 })
  }
  if (minutes >= 45) {
    tasks.push({ id: 'rush', title: 'Hız taktiği', detail: '3 dakikada olabildiğince çok bulmaca', href: '#/rush', minutes: 4 })
    tasks.push({ id: 'openings', title: 'Repertuvar', detail: 'Yeni bir açılış hattı öğren', href: '#/openings', minutes: 6 })
  }
  return tasks
}

export function dailyDone(p: Profile): string[] {
  return p.daily.date === todayKey() ? p.daily.done : []
}
