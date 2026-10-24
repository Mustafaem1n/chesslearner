import { getProfile } from './store'

/** Dosya gerektirmeyen, WebAudio ile üretilen kısa sesler. */
type SoundName = 'move' | 'capture' | 'check' | 'success' | 'error' | 'notify'

let ctx: AudioContext | null = null

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + dur)
}

function knock(start: number, gain: number) {
  if (!ctx) return
  const len = Math.floor(ctx.sampleRate * 0.05)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4
  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900
  const g = ctx.createGain()
  g.gain.value = gain
  src.buffer = buf
  src.connect(filter).connect(g).connect(ctx.destination)
  src.start(ctx.currentTime + start)
}

export function playSound(name: SoundName) {
  if (!getProfile().settings.sound) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    switch (name) {
      case 'move':
        knock(0, 0.9)
        break
      case 'capture':
        knock(0, 1.2)
        knock(0.06, 0.7)
        break
      case 'check':
        knock(0, 1)
        tone(880, 0.02, 0.12, 'sine', 0.08)
        break
      case 'success':
        tone(660, 0, 0.12, 'sine', 0.12)
        tone(880, 0.1, 0.18, 'sine', 0.12)
        break
      case 'error':
        tone(220, 0, 0.18, 'triangle', 0.15)
        break
      case 'notify':
        tone(740, 0, 0.12, 'sine', 0.1)
        break
    }
  } catch {
    /* ses desteklenmiyor */
  }
}

/** chess.js hamle bayraklarına göre uygun sesi çalar. */
export function playMoveSound(move: { san: string; captured?: string }) {
  if (move.san.includes('+') || move.san.includes('#')) playSound('check')
  else if (move.captured) playSound('capture')
  else playSound('move')
}
