import { useState } from 'react'
import { navigate } from '../../app/router'
import { isDue } from '../../core/srs'
import { markDailyTask, reviewCard, useProfile, type Profile } from '../../core/store'
import { courseById, lineCardId, lineSide, OPENING_COURSES, type OpeningCourse, type OpeningLine } from '../../data/openings'
import { LineTrainer } from './LineTrainer'
import './opening.css'

const randomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

function courseStats(p: Profile, c: OpeningCourse) {
  let learned = 0
  let due = 0
  for (const l of c.lines) {
    const card = p.srs[lineCardId(c, l)]
    if (card) {
      learned++
      if (isDue(card)) due++
    }
  }
  return { learned, due, total: c.lines.length }
}

export function OpeningsPage() {
  const profile = useProfile()
  const totalDue = OPENING_COURSES.reduce((n, c) => n + courseStats(profile, c).due, 0)
  return (
    <div className="openings">
      <div className="page-head">
        <h1>Açılışlar</h1>
        {totalDue > 0 && (
          <button className="btn primary" onClick={() => navigate('/opening-review')}>
            Tekrar zamanı gelen {totalDue} hat
          </button>
        )}
      </div>
      <p className="muted" style={{ marginTop: -8 }}>
        Önce bir hattı <b>Öğren</b> modunda oklarla oyna, sonra <b>Ezberden</b> tekrar et. Hatasız oynadığın hatlar aralıklı
        tekrarla günler sonra yeniden sorulur; böylece repertuvarın kalıcı olur.
      </p>
      <div className="course-grid">
        {OPENING_COURSES.map((c) => {
          const s = courseStats(profile, c)
          return (
            <a key={c.id} className="course-card" href={`#/opening/${c.id}`}>
              <div className="course-top">
                <span className={`side-dot ${c.side}`} />
                <b>{c.name}</b>
              </div>
              <span className="muted small">{c.description}</span>
              <div className="progress">
                <div style={{ width: `${(s.learned / s.total) * 100}%` }} />
              </div>
              <span className="muted small">
                {s.learned}/{s.total} hat öğrenildi{s.due ? ` · ${s.due} tekrar bekliyor` : ''}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

type Session = { line: OpeningLine; mode: 'learn' | 'drill'; key: number } | null

export function CoursePage({ id }: { id: string }) {
  const profile = useProfile()
  const course = courseById(id)
  const [session, setSession] = useState<Session>(null)
  if (!course) return <p className="muted">Kurs bulunamadı.</p>

  function finish(line: OpeningLine, mode: 'learn' | 'drill', mistakes: number) {
    if (!course) return
    const id = lineCardId(course, line)
    // Öğren modu kartı başlatır; ezber modunda hatasızlık derecelendirmeyi belirler
    if (mode === 'learn') {
      if (!profile.srs[id]) reviewCard(id, 3)
      markDailyTask('openings')
    } else reviewCard(id, mistakes === 0 ? 4 : mistakes === 1 ? 3 : 0)
  }

  const nextDrill = () => {
    const due = course.lines.filter((l) => {
      const card = profile.srs[lineCardId(course, l)]
      return card && isDue(card)
    })
    const pool = due.length ? due : course.lines.filter((l) => profile.srs[lineCardId(course, l)])
    return randomItem(pool)
  }

  if (session) {
    const { line, mode } = session
    const idx = course.lines.indexOf(line)
    const next = course.lines[idx + 1]
    return (
      <div>
        <div className="lesson-head">
          <div className="crumbs muted small">
            <a href="#/openings">Açılışlar</a> ›{' '}
            <a href={`#/opening/${course.id}`} onClick={() => setSession(null)}>
              {course.name}
            </a>
          </div>
        </div>
        <LineTrainer
          key={session.key}
          pgn={line.pgn}
          side={lineSide(course, line)}
          mode={mode}
          title={line.name}
          onComplete={(r) => finish(line, mode, r.mistakes)}
        >
          <div className="lesson-footer">
            {mode === 'learn' && (
              <button className="btn primary" onClick={() => setSession({ line, mode: 'drill', key: session.key + 1 })}>
                Şimdi ezberden oyna →
              </button>
            )}
            <button className="btn" onClick={() => setSession({ line, mode, key: session.key + 1 })}>
              ⟲ Tekrar
            </button>
            {mode === 'drill' && next && (
              <button className="btn" onClick={() => setSession({ line: next, mode: 'learn', key: session.key + 1 })}>
                Sonraki hat: {next.name}
              </button>
            )}
            <button className="btn" onClick={() => setSession(null)}>
              Hat listesi
            </button>
          </div>
        </LineTrainer>
      </div>
    )
  }

  const learnedAny = course.lines.some((l) => profile.srs[lineCardId(course, l)])
  return (
    <div className="openings">
      <div className="lesson-head">
        <div className="crumbs muted small">
          <a href="#/openings">Açılışlar</a>
        </div>
        <div className="page-head" style={{ margin: 0 }}>
          <h1>{course.name}</h1>
          {learnedAny && (
            <button className="btn primary" onClick={() => setSession({ line: nextDrill(), mode: 'drill', key: Date.now() })}>
              Rastgele hat ezberden
            </button>
          )}
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {course.description} Tarafın: <b>{course.side === 'w' ? 'Beyaz' : 'Siyah'}</b>
          {course.trap ? ' (tuzaklarda taraf hatta göre değişir)' : ''}.
        </p>
      </div>
      <div className="line-list">
        {course.lines.map((l) => {
          const card = profile.srs[lineCardId(course, l)]
          const status = !card ? 'Yeni' : isDue(card) ? 'Tekrar zamanı' : `${card.interval} gün sonra`
          return (
            <div key={l.id} className="line-row card">
              <div>
                <b>{l.name}</b>
                <div className="muted small">
                  {lineSide(course, l) === 'w' ? 'Beyaz' : 'Siyah'} · {status}
                </div>
              </div>
              <div className="line-actions">
                <button className="btn" onClick={() => setSession({ line: l, mode: 'learn', key: Date.now() })}>
                  Öğren
                </button>
                <button className="btn" onClick={() => setSession({ line: l, mode: 'drill', key: Date.now() })}>
                  Ezberden
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Tüm kurslarda tekrar zamanı gelen hatları sırayla çalıştırır */
export function OpeningReviewPage() {
  const profile = useProfile()
  const [key, setKey] = useState(0)
  const due: { course: OpeningCourse; line: OpeningLine }[] = []
  for (const course of OPENING_COURSES)
    for (const line of course.lines) {
      const card = profile.srs[lineCardId(course, line)]
      if (card && isDue(card)) due.push({ course, line })
    }
  const [item, setItem] = useState(() => due[0])
  const [done, setDone] = useState(false)

  if (!item) return <p className="muted">Şu an tekrar zamanı gelen hat yok. 👏</p>
  return (
    <div>
      <div className="lesson-head">
        <div className="crumbs muted small">
          <a href="#/openings">Açılışlar</a> › Tekrar ({due.length} hat kaldı)
        </div>
      </div>
      <LineTrainer
        key={`${item.course.id}:${item.line.id}:${key}`}
        pgn={item.line.pgn}
        side={lineSide(item.course, item.line)}
        mode="drill"
        title={`${item.course.name} — ${item.line.name}`}
        onComplete={(r) => {
          reviewCard(lineCardId(item.course, item.line), r.mistakes === 0 ? 4 : r.mistakes === 1 ? 3 : 0)
          setDone(true)
        }}
      >
        {done && (
          <div className="lesson-footer">
            <button
              className="btn primary"
              onClick={() => {
                const rest = due.filter((d) => !(d.course === item.course && d.line === item.line))
                setItem(rest[0])
                setDone(false)
                setKey((k) => k + 1)
              }}
            >
              Sonraki →
            </button>
          </div>
        )}
      </LineTrainer>
    </div>
  )
}
