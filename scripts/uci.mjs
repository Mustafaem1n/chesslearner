// Node'da Stockfish'i (WASM) alt süreç olarak çalıştıran küçük UCI istemcisi.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ENGINE = fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-18-lite-single.js', import.meta.url))

export function startEngine() {
  const proc = spawn(process.execPath, [ENGINE], { stdio: ['pipe', 'pipe', 'inherit'] })
  let buf = ''
  let waiter = null
  const lines = []
  proc.stdout.on('data', (d) => {
    buf += d
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      lines.push(line)
      if (waiter && waiter.test(line)) {
        const w = waiter
        waiter = null
        w.resolve(lines.splice(0))
      }
    }
  })
  const send = (c) => proc.stdin.write(c + '\n')
  const until = (test) => new Promise((resolve) => (waiter = { test, resolve }))

  async function init() {
    send('uci')
    await until((l) => l === 'uciok')
    send('isready')
    await until((l) => l === 'readyok')
  }

  /** multipv analiz; skorlar sırası gelen tarafa göre */
  async function analyse(fen, { depth = 18, multipv = 1, moves = [] } = {}) {
    send(`setoption name MultiPV value ${multipv}`)
    send(`position fen ${fen}${moves.length ? ' moves ' + moves.join(' ') : ''}`)
    send(`go depth ${depth}`)
    const out = await until((l) => l.startsWith('bestmove'))
    const best = new Map()
    for (const l of out) {
      if (!l.startsWith('info') || !l.includes(' pv ')) continue
      const t = l.split(' ')
      const mp = +(t[t.indexOf('multipv') + 1] || 1)
      const si = t.indexOf('score')
      const kind = t[si + 1]
      const val = +t[si + 2]
      const pv = t.slice(t.indexOf('pv') + 1)
      best.set(mp, { move: pv[0], pv, cp: kind === 'cp' ? val : undefined, mate: kind === 'mate' ? val : undefined })
    }
    return { bestMove: out.at(-1).split(' ')[1], lines: [...best.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]) }
  }

  const value = (l) => (l.mate !== undefined ? (l.mate > 0 ? 100000 - l.mate * 100 : -100000 - l.mate * 100) : l.cp)
  return { init, analyse, value, quit: () => proc.kill() }
}
