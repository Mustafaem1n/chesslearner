// Stockfish (lite, tek iş parçacıklı WASM) dosyalarını ve GPL lisans metnini public/ altına kopyalar.
// predev / prebuild ile otomatik çalışır (Vercel derlemesi dahil).
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'

const src = new URL('../node_modules/stockfish/', import.meta.url)
const dst = new URL('../public/stockfish/', import.meta.url)
const files = {
  'bin/stockfish-18-lite-single.js': 'stockfish-18-lite-single.js',
  'bin/stockfish-18-lite-single.wasm': 'stockfish-18-lite-single.wasm',
  'Copying.txt': 'COPYING.txt',
}

mkdirSync(dst, { recursive: true })
for (const [from, to] of Object.entries(files)) {
  const s = new URL(from, src)
  const d = new URL(to, dst)
  if (!existsSync(s)) throw new Error(`Stockfish dosyası bulunamadı: ${from} (npm install çalıştırıldı mı?)`)
  if (!existsSync(d) || statSync(d).size !== statSync(s).size) copyFileSync(s, d)
}
