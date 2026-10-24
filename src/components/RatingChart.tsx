import { useRef, useState } from 'react'
import './charts.css'

interface Point {
  t: number
  r: number
}

const fmtDate = (t: number) => new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

/** Tek serili puan geçmişi çizgisi; üzerine gelince en yakın noktayı gösterir. */
export function RatingChart({ points, height = 180 }: { points: Point[]; height?: number }) {
  const ref = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const width = 560
  const pad = { l: 40, r: 12, t: 12, b: 24 }
  if (points.length < 2) {
    return <p className="muted small">Grafik için biraz daha antrenman gerekiyor — her gün çözdüklerin burada birikecek.</p>
  }
  const rs = points.map((p) => p.r)
  const lo = Math.floor((Math.min(...rs) - 30) / 50) * 50
  const hi = Math.ceil((Math.max(...rs) + 30) / 50) * 50
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (width - pad.l - pad.r)
  const y = (r: number) => pad.t + (1 - (r - lo) / (hi - lo)) * (height - pad.t - pad.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.r)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${height - pad.b} L${x(0)},${height - pad.b} Z`
  const ticks = [lo, Math.round((lo + hi) / 2 / 10) * 10, hi]

  function move(e: React.MouseEvent) {
    const box = ref.current!.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * width
    const i = Math.round(((px - pad.l) / (width - pad.l - pad.r)) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, i)))
  }

  const h = hover !== null ? points[hover] : null
  return (
    <svg
      ref={ref}
      className="line-chart"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label={`Puan geçmişi: ${points[0].r} → ${points.at(-1)!.r}`}
      onMouseMove={move}
      onMouseLeave={() => setHover(null)}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line className="axis" x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} />
          <text className="tick" x={pad.l - 6} y={y(t)} textAnchor="end" dominantBaseline="middle">
            {t}
          </text>
        </g>
      ))}
      <text className="tick" x={pad.l} y={height - 6}>
        {fmtDate(points[0].t)}
      </text>
      <text className="tick" x={width - pad.r} y={height - 6} textAnchor="end">
        {fmtDate(points.at(-1)!.t)}
      </text>
      <path className="area" d={area} />
      <path className="series" d={line} />
      {h && hover !== null && (
        <g pointerEvents="none">
          <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={pad.t} y2={height - pad.b} />
          <circle className="marker" cx={x(hover)} cy={y(h.r)} r={5} />
          <g className="chart-tip">
            {(() => {
              const label = `${fmtDate(h.t)} · ${h.r}`
              const w = label.length * 6.6 + 16
              const tx = Math.min(width - w - 2, Math.max(2, x(hover) - w / 2))
              const ty = Math.max(2, y(h.r) - 34)
              return (
                <>
                  <rect x={tx} y={ty} width={w} height={24} rx={6} />
                  <text x={tx + w / 2} y={ty + 12} textAnchor="middle" dominantBaseline="middle">
                    {label}
                  </text>
                </>
              )
            })()}
          </g>
        </g>
      )}
    </svg>
  )
}
