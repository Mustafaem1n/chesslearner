import { useState } from 'react'
import { SKILL_LABEL, SKILLS, type Rating, type Skill } from '../core/rating'
import './charts.css'

interface Props {
  ratings: Record<Skill, Rating>
  size?: number
}

/** Eksen etiketleri için yanlarda bırakılan boşluk */
const SIDE = 44

/** Tek serili beceri radarı. Değerler ayrıca yanındaki listede yazılı olduğu için renk tek başına anlam taşımaz. */
export function SkillRadar({ ratings, size = 300 }: Props) {
  const [hover, setHover] = useState<Skill | null>(null)
  const max = Math.max(2000, Math.ceil((Math.max(...SKILLS.map((s) => ratings[s].r)) + 100) / 500) * 500)
  const c = size / 2
  const radius = c - 48
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / SKILLS.length
  const point = (i: number, v: number) => {
    const r = (Math.max(0, v) / max) * radius
    return [c + r * Math.cos(angle(i)), c + r * Math.sin(angle(i))] as const
  }
  const rings = [0.25, 0.5, 0.75, 1].map((f) => Math.round(f * max))
  const tickRings = rings.slice(0, -1)
  const poly = SKILLS.map((s, i) => point(i, ratings[s].r).join(',')).join(' ')

  return (
    <svg
      className="radar"
      viewBox={`${-SIDE} 0 ${size + 2 * SIDE} ${size}`}
      width="100%"
      style={{ maxWidth: size + 2 * SIDE }}
      role="img"
      aria-label={SKILLS.map((s) => `${SKILL_LABEL[s]} ${ratings[s].r}`).join(', ')}
    >
      {rings.map((v) => (
        <polygon
          key={v}
          className="radar-grid"
          points={SKILLS.map((_, i) => point(i, v).join(',')).join(' ')}
        />
      ))}
      {SKILLS.map((s, i) => {
        const [x, y] = point(i, max)
        const [lx, ly] = point(i, max * 1.17)
        return (
          <g key={s}>
            <line className="radar-grid" x1={c} y1={c} x2={x} y2={y} />
            <text
              className="radar-label"
              x={lx}
              y={ly}
              textAnchor={Math.abs(lx - c) < 4 ? 'middle' : lx > c ? 'start' : 'end'}
              dominantBaseline="middle"
            >
              {SKILL_LABEL[s]}
            </text>
          </g>
        )
      })}
      {tickRings.map((v) => (
        <text key={v} className="radar-tick" x={c + 3} y={c - (v / max) * radius - 2}>
          {v}
        </text>
      ))}
      <polygon className="radar-area" points={poly} />
      {SKILLS.map((s, i) => {
        const [x, y] = point(i, ratings[s].r)
        return (
          <g key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)}>
            <circle cx={x} cy={y} r={14} fill="transparent" />
            <circle className="radar-dot" cx={x} cy={y} r={hover === s ? 6 : 4.5} />
          </g>
        )
      })}
      {hover &&
        (() => {
          const i = SKILLS.indexOf(hover)
          const [x, y] = point(i, ratings[hover].r)
          const label = `${SKILL_LABEL[hover]}: ${ratings[hover].r}`
          const w = label.length * 6.6 + 16
          const tx = Math.min(size + SIDE - w - 4, Math.max(-SIDE + 4, x - w / 2))
          return (
            <g className="radar-tip" pointerEvents="none">
              <rect x={tx} y={y - 34} width={w} height={24} rx={6} />
              <text x={tx + w / 2} y={y - 22} textAnchor="middle" dominantBaseline="middle">
                {label}
              </text>
            </g>
          )
        })()}
    </svg>
  )
}
