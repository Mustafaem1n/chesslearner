import { useRef, useState } from 'react'
import { getProfile, resetProfile, updateProfile, useProfile, type Profile } from '../../core/store'
import './settings.css'

export function SettingsPage() {
  const p = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null)

  function exportData() {
    const blob = new Blob([JSON.stringify(getProfile(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `satranc-ilerleme-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File) {
    try {
      const data = JSON.parse(await file.text()) as Profile
      if (data.version !== 1 || !data.ratings) throw new Error('Tanınmayan dosya')
      updateProfile((d) => Object.assign(d, data))
      setMsg({ kind: 'good', text: 'İlerleme yüklendi.' })
    } catch (e) {
      setMsg({ kind: 'bad', text: `Dosya okunamadı: ${(e as Error).message}` })
    }
  }

  return (
    <div className="settings">
      <h1>Ayarlar</h1>
      <section className="card setting-row">
        <div>
          <b>Sesler</b>
          <div className="muted small">Hamle, doğru ve yanlış sesleri</div>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={p.settings.sound}
            onChange={(e) => updateProfile((d) => void (d.settings.sound = e.target.checked))}
          />
          <span />
        </label>
      </section>
      <section className="card setting-row">
        <div>
          <b>Tahta renkleri</b>
          <div className="muted small">Kare renk teması</div>
        </div>
        <div className="seg">
          {(
            [
              ['wood', 'Ahşap'],
              ['green', 'Yeşil'],
              ['blue', 'Mavi'],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              className={p.settings.boardTheme === t ? 'on' : ''}
              onClick={() => updateProfile((d) => void (d.settings.boardTheme = t))}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="card setting-row">
        <div>
          <b>Günlük antrenman süresi</b>
          <div className="muted small">Günlük planın uzunluğu</div>
        </div>
        <div className="seg">
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
      </section>
      <section className="card setting-row">
        <div>
          <b>Seviye testi</b>
          <div className="muted small">Puanlarını yeniden ölçmek için testi tekrarla</div>
        </div>
        <a className="btn" href="#/placement">
          Testi tekrarla
        </a>
      </section>
      <section className="card setting-row">
        <div>
          <b>İlerlemeyi yedekle</b>
          <div className="muted small">İlerlemen yalnızca bu tarayıcıda saklanır. Başka cihaza taşımak için dışa aktar.</div>
        </div>
        <div className="puzzle-actions">
          <button className="btn" onClick={exportData}>
            Dışa aktar
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            İçe aktar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && void importData(e.target.files[0])}
          />
        </div>
      </section>
      {msg && <p className={`msg ${msg.kind}`}>{msg.text}</p>}
      <section className="card setting-row danger">
        <div>
          <b>Sıfırla</b>
          <div className="muted small">Tüm puanlar, ilerleme ve tekrar kartları silinir.</div>
        </div>
        <button
          className="btn"
          onClick={() => {
            if (window.confirm('Tüm ilerleme silinecek. Emin misin?')) resetProfile()
          }}
        >
          İlerlemeyi sıfırla
        </button>
      </section>
      <p className="muted small">
        Bulmacalar: Lichess bulmaca veritabanı (CC0). Motor: Stockfish 18 (GPLv3, stockfish.js).
      </p>
    </div>
  )
}
