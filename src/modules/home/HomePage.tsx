import { RatingChart } from '../../components/RatingChart'
import { SkillList } from '../../components/SkillList'
import { SkillRadar } from '../../components/SkillRadar'
import { dailyDone, dailyPlan, dueCounts } from '../../core/daily'
import { overallRating, STAGES, stageForRating } from '../../core/rating'
import { streak, updateProfile, useProfile } from '../../core/store'
import { lineCardId, OPENING_COURSES } from '../../data/openings'
import './home.css'

const STEPS = [
  { title: 'Seviyeni ölç', text: '12 pozisyonluk kısa, oynayarak yapılan test.' },
  { title: 'Aşama aşama ilerle', text: 'Ders, pratik, yarım oyun ve ünite sınavı.' },
  { title: 'Her gün tekrar et', text: 'Hata defteri ve aralıklı tekrar ile kalıcı öğrenme.' },
]

function Welcome() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Satrancı oynayarak öğren</h1>
        <p className="muted">
          Önce kısa bir testle seviyeni belirleyeceğiz, sonra seni bulunduğun yerden adım adım yukarı taşıyacağız.
        </p>
        <div className="hero-actions">
          <a className="btn primary" href="#/placement">
            Seviye testine başla
          </a>
          <a className="btn" href="#/curriculum">
            Müfredata göz at
          </a>
        </div>
      </section>
      <section className="steps">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card step">
            <span className="step-num">{i + 1}</span>
            <h3>{s.title}</h3>
            <p className="muted">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

export function HomePage() {
  const p = useProfile()
  if (!p.placementDone) return <Welcome />

  const overall = overallRating(p.ratings)
  const stage = STAGES[stageForRating(overall)]
  const tasks = dailyPlan(p)
  const done = dailyDone(p)
  const finished = tasks.filter((t) => done.includes(t.id)).length
  const due = dueCounts(p)
  const days = streak(p)
  const linesLearned = OPENING_COURSES.reduce((n, c) => n + c.lines.filter((l) => p.srs[lineCardId(c, l)]).length, 0)
  const accuracy = p.stats.solved + p.stats.failed ? Math.round((p.stats.solved / (p.stats.solved + p.stats.failed)) * 100) : 0
  const unitsDone = Object.values(p.units).filter((u) => u.done).length

  return (
    <div className="dashboard">
      <section className="dash-top">
        <div className="card stat-hero">
          <div className="muted small">Genel puan</div>
          <div className="hero-number">{overall}</div>
          <span className="chip">
            Aşama {stage.id}: {stage.name}
          </span>
        </div>
        <div className="card stat-hero">
          <div className="muted small">Seri</div>
          <div className="hero-number">
            {days}
            <span className="unit"> gün</span>
          </div>
          <span className="muted small">{days ? 'Zinciri kırma!' : 'Bugün başla, seriyi başlat.'}</span>
        </div>
        <div className="card stat-grid">
          <div>
            <b>{p.stats.solved}</b>
            <span className="muted small">çözülen bulmaca</span>
          </div>
          <div>
            <b>%{accuracy}</b>
            <span className="muted small">doğruluk</span>
          </div>
          <div>
            <b>{unitsDone}</b>
            <span className="muted small">bitmiş ünite</span>
          </div>
          <div>
            <b>{linesLearned}</b>
            <span className="muted small">açılış hattı</span>
          </div>
        </div>
      </section>

      <section className="card daily">
        <div className="daily-head">
          <div>
            <h2>Bugünün antrenmanı</h2>
            <span className="muted small">
              {finished}/{tasks.length} tamamlandı · yaklaşık {tasks.reduce((n, t) => n + t.minutes, 0)} dakika
            </span>
          </div>
          <div className="seg" role="group" aria-label="Günlük süre">
            {([15, 30, 45] as const).map((m) => (
              <button
                key={m}
                className={p.settings.dailyMinutes === m ? 'on' : ''}
                onClick={() => updateProfile((d) => void (d.settings.dailyMinutes = m))}
              >
                {m} dk
              </button>
            ))}
          </div>
        </div>
        <div className="progress">
          <div style={{ width: `${(finished / tasks.length) * 100}%` }} />
        </div>
        <ol className="task-list">
          {tasks.map((t) => {
            const isDone = done.includes(t.id)
            return (
              <li key={t.id}>
                <a href={t.href} className={`task ${isDone ? 'done' : ''}`}>
                  <span className="task-check">{isDone ? '✓' : ''}</span>
                  <span>
                    <b>{t.title}</b>
                    <span className="muted small"> · {t.detail}</span>
                  </span>
                  <span className="muted small task-min">{t.minutes} dk</span>
                </a>
              </li>
            )
          })}
        </ol>
        {finished === tasks.length && <p className="msg good">Bugünkü antrenman tamam! Yarın görüşmek üzere. 🎉</p>}
      </section>

      <section className="dash-grid">
        <div className="card">
          <h3>Puan geçmişi</h3>
          <RatingChart points={p.ratingHistory} />
        </div>
        <div className="card">
          <h3>Beceri profili</h3>
          <div className="radar-wrap">
            <SkillRadar ratings={p.ratings} size={260} />
            <SkillList ratings={p.ratings} />
          </div>
        </div>
      </section>

      <section className="card review-summary">
        <div>
          <h3>Tekrar kuyruğu</h3>
          <span className="muted small">
            Hata defteri: {Object.keys(p.mistakes).length} pozisyon ({due.mistakes} hazır) · Açılış: {due.openings} · Oyunsonu:{' '}
            {due.endgames}
          </span>
        </div>
        <a className="btn" href="#/review">
          Tekrar et
        </a>
      </section>
    </div>
  )
}
