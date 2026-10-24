import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../../app/router'
import { dueCounts, weakestSkill } from '../../core/daily'
import { SKILL_LABEL } from '../../core/rating'
import { gradeFromResult, isDue } from '../../core/srs'
import { getProfile, markDailyTask, reviewMistake, useProfile, type Mistake } from '../../core/store'
import { ENDGAMES, endgameCardId } from '../../data/endgames'
import { loadPuzzles, puzzleToExercise, type Puzzle } from '../../data/puzzles'
import { PuzzleSet } from '../lesson/steps'
import { PuzzlePlayer, type ScriptedExercise } from '../puzzle/PuzzlePlayer'
import './review.css'

function mistakeExercise(m: Mistake, byId: Map<string, Puzzle>): ScriptedExercise | null {
  if (m.kind === 'puzzle') {
    const p = m.puzzleId ? byId.get(m.puzzleId) : undefined
    return p ? { ...puzzleToExercise(p), id: m.id } : null
  }
  if (!m.fen || !m.best?.length) return null
  return { id: m.id, fen: m.fen, solution: [m.best], prompt: m.note ?? 'Bu pozisyonda oyunda hata yapmıştın. En iyi hamleyi bul.' }
}

export function ReviewPage() {
  const profile = useProfile()
  const [byId, setById] = useState<Map<string, Puzzle> | null>(null)
  // Oturum başındaki kuyruk sabit kalır; çözdükçe ilerler
  const [queue] = useState(() =>
    Object.values(getProfile().mistakes)
      .filter((m) => m.card.due <= Date.now())
      .sort((a, b) => a.card.due - b.card.due)
      .map((m) => m.id),
  )
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [solved, setSolved] = useState(0)

  useEffect(() => {
    void loadPuzzles().then((ps) => setById(new Map(ps.map((p) => [p.id, p]))))
  }, [])

  const currentId = queue[index]
  // Kayıt güncellendikçe nesne değişir; egzersizi kimliğe bağla ki oynatıcı baştan kurulmasın
  const [snapshot] = useState(() => getProfile().mistakes)
  const current = currentId ? (profile.mistakes[currentId] ?? snapshot[currentId]) : undefined
  const exercise = useMemo(() => {
    const m = currentId ? snapshot[currentId] : undefined
    return m && byId ? mistakeExercise(m, byId) : null
  }, [currentId, snapshot, byId])
  const finished = index >= queue.length
  const due = dueCounts(profile)
  const dueEndgames = ENDGAMES.filter((e) => {
    const c = profile.srs[endgameCardId(e.id)]
    return c && isDue(c)
  })

  useEffect(() => {
    if (finished) markDailyTask('review')
  }, [finished])

  if (!byId) return <p className="muted">Yükleniyor…</p>

  if (!finished && current && !exercise) {
    // Veri bulunamayan kayıt: atla
    return (
      <button className="btn" onClick={() => setIndex((i) => i + 1)}>
        Sonraki
      </button>
    )
  }

  if (!finished && exercise && current) {
    return (
      <div>
        <div className="page-head">
          <h1>Hata defteri</h1>
          <span className="muted">
            {index + 1} / {queue.length}
          </span>
        </div>
        <PuzzlePlayer
          key={exercise.id + index}
          exercise={exercise}
          onComplete={(o) => {
            reviewMistake(current.id, gradeFromResult({ success: o.success, hints: o.hints, timeMs: o.timeMs }))
            if (o.success) setSolved((n) => n + 1)
            setAnswered(true)
          }}
          header={
            <span className="muted small">
              Daha önce yanlış çözdüğün pozisyon · {current.card.lapses} kez yanlış, üst üste {current.card.reps} kez doğru (3 olunca
              defterden çıkar)
            </span>
          }
        >
          {answered && (
            <button
              className="btn primary"
              autoFocus
              onClick={() => {
                setAnswered(false)
                setIndex((i) => i + 1)
              }}
            >
              Sonraki →
            </button>
          )}
        </PuzzlePlayer>
      </div>
    )
  }

  return (
    <div className="review">
      <div className="page-head">
        <h1>Tekrar</h1>
      </div>
      {queue.length > 0 ? (
        <p className="msg good">
          Hata defteri tekrarı bitti: {solved}/{queue.length} doğru.
        </p>
      ) : (
        <p className="muted">Hata defterinde şu an tekrar zamanı gelen pozisyon yok.</p>
      )}
      <div className="review-cards">
        <div className="card">
          <h3>Açılış hatları</h3>
          <p className="muted small">{due.openings ? `${due.openings} hat tekrar bekliyor.` : 'Tekrar bekleyen hat yok.'}</p>
          <button className="btn" disabled={!due.openings} onClick={() => navigate('/opening-review')}>
            Açılış tekrarı
          </button>
        </div>
        <div className="card">
          <h3>Oyunsonları</h3>
          {dueEndgames.length ? (
            <ul className="plain-list">
              {dueEndgames.map((e) => (
                <li key={e.id}>
                  <a href={`#/endgame/${e.id}`}>{e.title}</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Tekrar bekleyen oyunsonu yok.</p>
          )}
        </div>
        <div className="card">
          <h3>Hata defteri</h3>
          <p className="muted small">
            Toplam {Object.keys(profile.mistakes).length} pozisyon. Yanlış çözdüğün her bulmaca buraya girer ve 20 dakika, 1 gün,
            6 gün… aralıklarla yeniden sorulur.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Günlük plandaki ısınma ve zayıf alan görevleri */
export function DailyTaskPage({ task }: { task: string }) {
  const profile = useProfile()
  const [key, setKey] = useState(0)
  const weak = weakestSkill(profile)
  const isWarmup = task === 'warmup'
  const skill = isWarmup ? 'tactics' : weak
  return (
    <div>
      <div className="page-head">
        <h1>{isWarmup ? 'Isınma' : `Zayıf alan: ${SKILL_LABEL[weak]}`}</h1>
        <a className="btn" href="#/">
          ← Plana dön
        </a>
      </div>
      <PuzzleSet
        key={`${task}-${key}`}
        count={isWarmup ? 5 : 6}
        skill={skill}
        // Isınma bir tık kolay olsun
        targetRating={(s) => profile.ratings[s].r - (isWarmup ? 150 : 0)}
        mode="practice"
        intro={<span className="muted small">{isWarmup ? 'Kısa ve hızlı: zihni açmak için.' : 'Puanının en düşük olduğu alan.'}</span>}
        onFinish={() => markDailyTask(task)}
        footer={(solved, n) => (
          <div className="exam-result">
            <div className="result-title good">
              {solved}/{n} çözüldü — görev tamam!
            </div>
            <div className="lesson-footer">
              <button className="btn primary" onClick={() => navigate('/')}>
                Plana dön
              </button>
              <button className="btn" onClick={() => setKey((k) => k + 1)}>
                Bir set daha
              </button>
            </div>
          </div>
        )}
      />
    </div>
  )
}
