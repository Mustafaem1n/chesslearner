/**
 * Stockfish (WASM) için Web Worker sarmalayıcısı.
 * İstekler sıraya alınır; her istek bir `bestmove` satırıyla biter.
 * Skorlar her zaman **sırası gelen tarafın** bakış açısındandır.
 */

export interface EngineLine {
  /** İlk hamle (UCI) */
  move: string
  pv: string[]
  depth: number
  cp?: number
  mate?: number
}

export interface Analysis {
  bestMove: string | null
  lines: EngineLine[]
}

export interface AnalyseOptions {
  depth?: number
  movetime?: number
  multipv?: number
  /** Stockfish "Skill Level" 0–20 (varsayılan 20) */
  skill?: number
}

interface Job {
  fen: string
  opts: AnalyseOptions
  resolve: (a: Analysis) => void
  reject: (e: Error) => void
}

const ENGINE_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-18-lite-single.js`

class Engine {
  private worker: Worker
  private ready: Promise<void>
  private queue: Job[] = []
  private current: Job | null = null
  private lines = new Map<number, EngineLine>()
  private skill = 20
  private multipv = 1
  private onLine: ((line: string) => void) | null = null

  constructor() {
    this.worker = new Worker(ENGINE_URL)
    this.worker.onmessage = (e: MessageEvent<string>) => this.handle(String(e.data))
    this.ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Motor yüklenemedi')), 20000)
      this.onLine = (line) => {
        if (line === 'uciok') this.send('isready')
        if (line === 'readyok') {
          clearTimeout(timer)
          this.onLine = null
          resolve()
        }
      }
    })
    this.send('uci')
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd)
  }

  private handle(line: string) {
    if (this.onLine) {
      this.onLine(line)
      return
    }
    if (!this.current) return
    if (line.startsWith('info') && line.includes(' pv ')) {
      const parsed = parseInfo(line)
      if (parsed) this.lines.set(parsed.multipv, parsed.line)
    } else if (line.startsWith('bestmove')) {
      const best = line.split(' ')[1]
      const job = this.current
      const lines = [...this.lines.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l)
      this.current = null
      this.lines.clear()
      job.resolve({ bestMove: best && best !== '(none)' ? best : null, lines })
      this.next()
    }
  }

  private next() {
    if (this.current || this.queue.length === 0) return
    const job = this.queue.shift()!
    this.current = job
    const { opts } = job
    const skill = opts.skill ?? 20
    const multipv = opts.multipv ?? 1
    if (skill !== this.skill) {
      this.send(`setoption name Skill Level value ${skill}`)
      this.skill = skill
    }
    if (multipv !== this.multipv) {
      this.send(`setoption name MultiPV value ${multipv}`)
      this.multipv = multipv
    }
    this.send(`position fen ${job.fen}`)
    if (opts.movetime) this.send(`go movetime ${opts.movetime}${opts.depth ? ` depth ${opts.depth}` : ''}`)
    else this.send(`go depth ${opts.depth ?? 12}`)
  }

  async analyse(fen: string, opts: AnalyseOptions = {}): Promise<Analysis> {
    await this.ready
    return new Promise((resolve, reject) => {
      this.queue.push({ fen, opts, resolve, reject })
      this.next()
    })
  }

  /** Bekleyen tüm istekleri iptal eder; çalışan analiz erken biter. */
  cancelAll() {
    for (const job of this.queue) job.reject(new Error('cancelled'))
    this.queue = []
    if (this.current) this.send('stop')
  }

  newGame() {
    this.send('ucinewgame')
  }
}

function parseInfo(line: string): { multipv: number; line: EngineLine } | null {
  const t = line.split(' ')
  let depth = 0
  let multipv = 1
  let cp: number | undefined
  let mate: number | undefined
  let pv: string[] = []
  for (let i = 0; i < t.length; i++) {
    switch (t[i]) {
      case 'depth':
        depth = +t[++i]
        break
      case 'multipv':
        multipv = +t[++i]
        break
      case 'score':
        if (t[i + 1] === 'cp') cp = +t[i + 2]
        else if (t[i + 1] === 'mate') mate = +t[i + 2]
        i += 2
        break
      case 'pv':
        pv = t.slice(i + 1)
        i = t.length
        break
    }
  }
  if (!pv.length) return null
  return { multipv, line: { move: pv[0], pv, depth, cp, mate } }
}

let instance: Engine | null = null

export function getEngine(): Engine {
  instance ??= new Engine()
  return instance
}

export type { Engine }
