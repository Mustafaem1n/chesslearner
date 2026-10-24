import { useState } from 'react'
import { navigate } from '../../app/router'
import { STAGES } from '../../core/rating'
import { updateProfile } from '../../core/store'
import { CURRICULUM } from '../../data/curriculum'
import { PuzzleSet } from './steps'
import './lesson.css'

const PASS = 0.75
const COUNT = 12

/** Aşama atlama sınavı: konuları zaten bilen kullanıcı tüm aşamayı tek sınavla geçer */
export function StageExamPage({ stage }: { stage: number }) {
  const [attempt, setAttempt] = useState(0)
  const [started, setStarted] = useState(false)
  const data = CURRICULUM[stage]
  const info = STAGES[stage]
  if (!data || stage === 0) return <p className="muted">Bu aşama için sınav yok.</p>

  const themes = [...new Set(data.units.flatMap((u) => u.exam?.themes ?? []))]
  const target = info.max - 100

  if (!started) {
    return (
      <div className="placement-intro">
        <h1>
          Aşama {stage} atlama sınavı: {data.title}
        </h1>
        <p className="muted">
          Bu aşamanın konularını zaten biliyorsan tek sınavla geçebilirsin. Aşamanın tüm temalarından {COUNT} bulmaca, ~{target}{' '}
          puan civarında. İpucu yok. Geçmek için %{PASS * 100} gerekli; geçersen aşamadaki tüm üniteler tamamlanmış sayılır.
        </p>
        <div className="puzzle-actions">
          <button className="btn primary" onClick={() => setStarted(true)}>
            Sınava başla
          </button>
          <a className="btn" href="#/curriculum">
            Vazgeç
          </a>
        </div>
      </div>
    )
  }

  return (
    <PuzzleSet
      key={attempt}
      count={COUNT}
      themes={themes.length ? themes : undefined}
      targetRating={() => target}
      mode="test"
      intro={
        <div>
          <h3>
            Aşama {stage}: {data.title}
          </h3>
          <span className="muted small">Geçmek için {Math.ceil(COUNT * PASS)} doğru</span>
        </div>
      }
      onFinish={(solved, n) => {
        if (solved / n < PASS) return
        updateProfile((p) => {
          for (const u of data.units) p.units[u.id] = { ...p.units[u.id], done: true }
        })
      }}
      footer={(solved, n) => {
        const passed = solved / n >= PASS
        return (
          <div className="exam-result">
            <div className={`result-title ${passed ? 'good' : 'bad'}`}>
              {passed ? `Geçtin! ${solved}/${n} — Aşama ${stage} tamamlandı.` : `${solved}/${n}: bu aşamayı ünite ünite çalışmanı öneririz.`}
            </div>
            <div className="lesson-footer">
              <button className="btn primary" onClick={() => navigate('/curriculum')}>
                Müfredata dön
              </button>
              {!passed && (
                <button className="btn" onClick={() => setAttempt((a) => a + 1)}>
                  ⟲ Tekrar dene
                </button>
              )}
            </div>
          </div>
        )
      }}
    />
  )
}
