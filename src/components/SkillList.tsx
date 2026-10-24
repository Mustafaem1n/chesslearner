import { SKILL_LABEL, SKILLS, type Rating, type Skill } from '../core/rating'
import './charts.css'

/** Radarın tablo karşılığı: her beceri için sayı ve çubuk */
export function SkillList({ ratings }: { ratings: Record<Skill, Rating> }) {
  const max = Math.max(2000, ...SKILLS.map((s) => ratings[s].r))
  const sorted = [...SKILLS].sort((a, b) => ratings[b].r - ratings[a].r)
  return (
    <div className="skill-list">
      {sorted.map((s) => (
        <div key={s} className="skill-row">
          <span>{SKILL_LABEL[s]}</span>
          <b style={{ fontVariantNumeric: 'tabular-nums' }}>{ratings[s].r}</b>
          <div className="skill-bar">
            <div style={{ width: `${(ratings[s].r / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
