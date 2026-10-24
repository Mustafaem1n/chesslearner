import { useState } from 'react'
import { navigate } from '../../app/router'
import { isDue } from '../../core/srs'
import { recordResult, reviewCard, useProfile } from '../../core/store'
import { ENDGAMES, endgameById, endgameCardId, type HalfGame } from '../../data/endgames'
import { PuzzleSet } from '../lesson/steps'
import { HalfGamePlayer } from './HalfGamePlayer'
import './endgames.css'

const GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Temel matlar', ids: ['eg-krr', 'eg-kqk', 'eg-krk', 'eg-kbbk', 'eg-kbnk'] },
  { title: 'Piyon oyunsonları', ids: ['eg-square', 'eg-kp-sixth', 'eg-kp-opp-defend', 'eg-kp-key'] },
  { title: 'Kale ve vezir oyunsonları', ids: ['eg-lucena', 'eg-philidor', 'eg-q-vs-p'] },
]

const GOAL_LABEL: Record<HalfGame['goal'], string> = { mate: 'Mat et', win: 'Kazan', promote: 'Terfi ettir', draw: 'Berabere tut' }

export function EndgamesPage() {
  const profile = useProfile()
  const [practice, setPractice] = useState(0)

  return (
    <div className="endgames">
      <div className="page-head">
        <h1>Oyunsonları</h1>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>
        Bilinmesi gereken teorik pozisyonlar. Her birini motora karşı oyna; başardıkça aralıklı tekrar seni belirli
        aralıklarla yeniden sınar, böylece teknik kalıcı olur.
      </p>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="eg-group">{g.title}</h2>
          <div className="eg-grid">
            {g.ids.map((id) => {
              const eg = endgameById(id)!
              const card = profile.srs[endgameCardId(id)]
              const status = !card ? 'new' : isDue(card) ? 'due' : 'learned'
              return (
                <a key={id} className={`eg-card ${status}`} href={`#/endgame/${id}`}>
                  <div className="eg-top">
                    <b>{eg.title}</b>
                    <span className="muted small">{eg.rating}</span>
                  </div>
                  <span className="muted small">
                    {GOAL_LABEL[eg.goal]} · {eg.moveLimit} hamle
                  </span>
                  <span className={`eg-status ${status}`}>
                    {status === 'new' ? 'Yeni' : status === 'due' ? 'Tekrar zamanı' : `Öğrenildi · ${card!.interval} gün sonra`}
                  </span>
                </a>
              )
            })}
          </div>
        </section>
      ))}
      <section>
        <h2 className="eg-group">Oyunsonu bulmacaları</h2>
        {practice === 0 ? (
          <button className="btn primary" onClick={() => setPractice(1)}>
            10 oyunsonu bulmacası çöz
          </button>
        ) : (
          <PuzzleSet
            key={practice}
            count={10}
            skill="endgame"
            targetRating={(s) => profile.ratings[s].r}
            mode="practice"
            intro={<b>Oyunsonu bulmacaları</b>}
            onFinish={() => {}}
            footer={(solved, n) => (
              <div className="exam-result">
                <div className="result-title good">
                  {solved}/{n} çözüldü
                </div>
                <button className="btn" onClick={() => setPractice((p) => p + 1)}>
                  10 tane daha
                </button>
              </div>
            )}
          />
        )}
      </section>
    </div>
  )
}

export function EndgamePlayPage({ id }: { id: string }) {
  const eg = endgameById(id)
  const [attempt, setAttempt] = useState(0)
  if (!eg) return <p className="muted">Pozisyon bulunamadı.</p>
  const idx = ENDGAMES.indexOf(eg)
  const next = ENDGAMES[idx + 1]
  return (
    <div>
      <div className="lesson-head">
        <div className="crumbs muted small">
          <a href="#/endgames">Oyunsonları</a> › {eg.title}
        </div>
      </div>
      <HalfGamePlayer
        key={`${id}-${attempt}`}
        game={eg}
        onComplete={(o) => {
          recordResult({ id: eg.id, skills: eg.skills, rating: eg.rating, score: o.success ? 1 : 0 })
          reviewCard(endgameCardId(eg.id), o.success ? (o.movesUsed <= eg.moveLimit * 0.7 ? 5 : 4) : 0)
        }}
      >
        <div className="lesson-footer">
          <button className="btn" onClick={() => setAttempt((a) => a + 1)}>
            ⟲ Tekrar oyna
          </button>
          {next && (
            <button className="btn primary" onClick={() => navigate(`/endgame/${next.id}`)}>
              Sonraki: {next.title} →
            </button>
          )}
        </div>
      </HalfGamePlayer>
    </div>
  )
}
