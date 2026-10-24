import { overallRating, STAGES, stageForRating } from '../../core/rating'
import { useProfile } from '../../core/store'
import { CURRICULUM } from '../../data/curriculum'
import './curriculum.css'

export function CurriculumPage() {
  const profile = useProfile()
  const recommended = profile.placementDone ? stageForRating(overallRating(profile.ratings)) : 0

  return (
    <div className="curriculum">
      <div className="page-head">
        <h1>Müfredat</h1>
        {!profile.placementDone && (
          <a className="btn primary" href="#/placement">
            Önce seviyeni ölç
          </a>
        )}
      </div>
      {CURRICULUM.map((stage) => {
        const done = stage.units.filter((u) => profile.units[u.id]?.done).length
        const info = STAGES[stage.id]
        return (
          <section key={stage.id} className={`stage ${stage.id === recommended ? 'recommended' : ''}`}>
            <div className="stage-head">
              <div>
                <h2>
                  Aşama {stage.id}: {stage.title}
                </h2>
                <p className="muted small">
                  {stage.description} · {info.min}–{stage.id === 5 ? '…' : info.max}
                </p>
              </div>
              <div className="stage-meta">
                {stage.id === recommended && <span className="chip">Senin seviyen</span>}
                <span className="muted small">
                  {done}/{stage.units.length} ünite
                </span>
                {stage.id > 0 && done < stage.units.length && (
                  <a className="btn small-btn" href={`#/stage-exam/${stage.id}`} title="Bu aşamayı biliyorsan sınavla geç">
                    Atlama sınavı
                  </a>
                )}
              </div>
            </div>
            <div className="progress">
              <div style={{ width: `${(done / stage.units.length) * 100}%` }} />
            </div>
            <div className="unit-grid">
              {stage.units.map((u, i) => {
                const p = profile.units[u.id]
                const total = u.steps.length + (u.exam ? 1 : 0)
                const status = p?.done ? 'done' : p?.step ? 'started' : 'new'
                return (
                  <a key={u.id} href={`#/unit/${u.id}`} className={`unit-card ${status}`}>
                    <span className="unit-num">{p?.done ? '✓' : i + 1}</span>
                    <div>
                      <b>{u.title}</b>
                      <div className="muted small">{u.summary}</div>
                      {status === 'started' && (
                        <div className="muted small">
                          Adım {(p?.step ?? 0) + 1}/{total}
                        </div>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
