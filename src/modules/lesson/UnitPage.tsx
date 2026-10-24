import { useState } from 'react'
import { navigate } from '../../app/router'
import { STAGES, type Skill } from '../../core/rating'
import { getProfile, markDailyTask, recordResult, updateProfile, useProfile } from '../../core/store'
import { nextUnit, unitById, type Unit } from '../../data/curriculum'
import { endgameById } from '../../data/endgames'
import { HalfGamePlayer } from '../endgame/HalfGamePlayer'
import { MoveStep, PlanStep, PuzzleSet, SquaresStep, StarsStep, TextStep } from './steps'
import './lesson.css'

export function UnitPage({ id }: { id: string }) {
  const unit = unitById(id)
  if (!unit) return <p className="muted">Ünite bulunamadı.</p>
  return <UnitPlayer key={unit.id} unit={unit} />
}

function UnitPlayer({ unit }: { unit: Unit }) {
  const profile = useProfile()
  const progress = profile.units[unit.id]
  const total = unit.steps.length + (unit.exam ? 1 : 0)
  const [index, setIndex] = useState(() => Math.min(progress?.step ?? 0, total - 1))
  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set(Array.from({ length: progress?.step ?? 0 }, (_, i) => i)))
  const [attempt, setAttempt] = useState(0)

  const stage = STAGES[unit.stage]
  const targetRating = (skill: Skill) => {
    const r = getProfile().ratings[skill].r
    return Math.max(stage.min + 50, Math.min(stage.max + 50, r))
  }

  function go(i: number) {
    setIndex(i)
    setAttempt((a) => a + 1)
    updateProfile((p) => {
      const u = (p.units[unit.id] ??= { done: false })
      u.step = Math.max(u.step ?? 0, i)
    })
  }

  function markDone(i: number) {
    setDoneSteps((s) => new Set(s).add(i))
    markDailyTask('lesson')
  }

  function finishUnit(best?: number) {
    updateProfile((p) => {
      const u = (p.units[unit.id] ??= { done: false })
      u.done = true
      u.step = total - 1
      if (best !== undefined) u.best = Math.max(u.best ?? 0, best)
    })
  }

  const isExam = unit.exam && index === unit.steps.length
  const isLast = index === total - 1
  const next = nextUnit(unit.id)
  const currentDone = doneSteps.has(index)

  const continueButton = (
    <div className="lesson-footer">
      {index > 0 && (
        <button className="btn" onClick={() => go(index - 1)}>
          ← Geri
        </button>
      )}
      {!isLast ? (
        <button
          className={`btn ${currentDone || unit.steps[index]?.type === 'text' ? 'primary' : ''}`}
          onClick={() => {
            markDone(index)
            go(index + 1)
          }}
        >
          {currentDone || unit.steps[index]?.type === 'text' ? 'Devam →' : 'Atla →'}
        </button>
      ) : (
        !unit.exam && (
          <button
            className="btn primary"
            onClick={() => {
              finishUnit()
              navigate(next ? `/unit/${next.id}` : '/curriculum')
            }}
          >
            Üniteyi bitir ✓
          </button>
        )
      )}
    </div>
  )

  const step = unit.steps[index]
  const common = {
    onDone: () => markDone(index),
    targetRating,
    footer: continueButton,
  }
  let body: React.ReactNode
  if (isExam) {
    const exam = unit.exam!
    body = (
      <PuzzleSet
        key={`exam-${attempt}`}
        count={exam.count}
        themes={exam.themes}
        skill={exam.skill}
        targetRating={targetRating}
        mode="test"
        intro={
          <div>
            <h3>Ünite sınavı</h3>
            <p className="muted small" style={{ margin: 0 }}>
              {exam.count} bulmaca, ipucu yok. Geçmek için %{Math.round(exam.pass * 100)} gerekli.
            </p>
          </div>
        }
        onFinish={(solved, n) => {
          if (solved / n >= exam.pass) finishUnit(Math.round((solved / n) * 100))
        }}
        footer={(solved, n) => {
          const passed = solved / n >= exam.pass
          return (
            <div className="exam-result">
              <div className={`result-title ${passed ? 'good' : 'bad'}`}>
                {passed ? `Geçtin! ${solved}/${n}` : `${solved}/${n} — biraz daha pratik`}
              </div>
              <div className="lesson-footer">
                {passed && next && (
                  <button className="btn primary" onClick={() => navigate(`/unit/${next.id}`)}>
                    Sonraki ünite: {next.title} →
                  </button>
                )}
                <button
                  className="btn"
                  onClick={() => setAttempt((a) => a + 1)}
                >
                  ⟲ Sınavı tekrarla
                </button>
                <button className="btn" onClick={() => navigate('/curriculum')}>
                  Müfredat
                </button>
              </div>
            </div>
          )
        }}
      />
    )
  } else {
    switch (step.type) {
      case 'text':
        body = <TextStep step={step} {...common} />
        break
      case 'move':
        body = <MoveStep key={`${index}-${attempt}`} step={step} {...common} />
        break
      case 'stars':
        body = <StarsStep key={`${index}-${attempt}`} step={step} {...common} />
        break
      case 'squares':
        body = <SquaresStep key={`${index}-${attempt}`} step={step} {...common} />
        break
      case 'plan':
        body = <PlanStep key={`${index}-${attempt}`} step={step} {...common} />
        break
      case 'puzzles':
        body = (
          <PuzzleSet
            key={`${index}-${attempt}`}
            count={step.count}
            themes={step.themes}
            skill={step.skill}
            maxUserMoves={step.maxUserMoves}
            targetRating={targetRating}
            mode="practice"
            intro={<p className="lesson-text">{step.text}</p>}
            onFinish={() => markDone(index)}
            footer={(solved, n) => (
              <>
                <div className="result-title good">
                  Set bitti: {solved}/{n}
                </div>
                {continueButton}
              </>
            )}
          />
        )
        break
      case 'halfgame': {
        const game = endgameById(step.endgameId)!
        body = (
          <HalfGamePlayer
            key={`${index}-${attempt}`}
            game={game}
            header={step.text ? <p className="lesson-text">{step.text}</p> : undefined}
            onComplete={(o) => {
              recordResult({ id: game.id, skills: game.skills, rating: game.rating, score: o.success ? 1 : 0 })
              if (o.success) markDone(index)
            }}
          >
            {continueButton}
          </HalfGamePlayer>
        )
        break
      }
    }
  }

  return (
    <div>
      <div className="lesson-head">
        <div className="crumbs muted">
          <a href="#/curriculum">Müfredat</a> › Aşama {unit.stage}: {stage.name}
        </div>
        <div className="page-head" style={{ margin: 0 }}>
          <h1>{unit.title}</h1>
          {progress?.done && <span className="chip">✓ Tamamlandı{progress.best ? ` · %${progress.best}` : ''}</span>}
        </div>
        <div className="step-dots">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              title={i === unit.steps.length ? 'Sınav' : `Adım ${i + 1}`}
              className={i === index ? 'current' : doneSteps.has(i) ? 'done' : ''}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
      {body}
      {!isExam && step.type !== 'text' && !currentDone && (
        <div className="muted small" style={{ marginTop: 10 }}>
          Adımı tamamlayınca “Devam” düğmesi belirir. Üstteki çubuklarla adımlar arasında gezinebilirsin.
        </div>
      )}
    </div>
  )
}
