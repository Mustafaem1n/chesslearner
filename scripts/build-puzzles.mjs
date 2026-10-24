// Lichess bulmaca veritabanını (CC0) standart girdiden CSV olarak okur ve
// beceri alanı × puan aralığı × tema bazında dengeli bir alt küme seçer.
// Çıktı: public/data/puzzles.json
//
// Kullanım (dosyada skippable frame olduğu için Node'un zstd'si yerine zstd CLI):
//   curl -sL https://database.lichess.org/lichess_db_puzzle.csv.zst | zstd -dc | node scripts/build-puzzles.mjs
import { writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const OUT = new globalThis.URL('../public/data/puzzles.json', import.meta.url)

const MATE = ['mateIn1', 'mateIn2', 'mateIn3', 'mateIn4', 'mateIn5', 'mate', 'backRankMate', 'smotheredMate',
  'anastasiaMate', 'arabianMate', 'bodenMate', 'doubleBishopMate', 'dovetailMate', 'hookMate', 'killBoxMate',
  'vukovicMate', 'balestraMate', 'blindSwineMate', 'cornerMate', 'epauletteMate', 'morphysMate', 'operaMate',
  'pillsburysMate', 'swallowstailMate', 'triangleMate']
const ENDGAME = ['endgame', 'pawnEndgame', 'rookEndgame', 'queenEndgame', 'bishopEndgame', 'knightEndgame',
  'queenRookEndgame']

/** Puzzle → birincil beceri alanı */
function skillOf(themes) {
  if (themes.some((t) => MATE.includes(t))) return 'mates'
  if (themes.includes('endgame')) return 'endgame'
  if (themes.includes('opening')) return 'opening'
  if (themes.includes('veryLong') || themes.includes('long') || themes.includes('quietMove')
    || themes.includes('defensiveMove') || themes.includes('intermezzo')) return 'calculation'
  return 'tactics'
}

const PER_SKILL_BUCKET = { tactics: 120, mates: 35, endgame: 40, calculation: 50, opening: 45 }
// Derslerde tema bazında bulmaca çekebilmek için ek havuz
const LESSON_THEMES = ['fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck', 'deflection', 'attraction',
  'hangingPiece', 'sacrifice', 'trappedPiece', 'xRayAttack', 'interference', 'clearance', 'capturingDefender',
  'intermezzo', 'quietMove', 'defensiveMove', 'zugzwang', 'promotion', 'underPromotion', 'enPassant',
  'advancedPawn', 'exposedKing', 'kingsideAttack', 'queensideAttack', 'attackingF2F7', 'castling',
  ...MATE, ...ENDGAME]
const PER_THEME_BUCKET = 14

const bucketOf = (r) => Math.max(4, Math.min(28, Math.floor(r / 100)))
const counts = new Map()
const take = (key, max) => {
  const n = counts.get(key) ?? 0
  if (n >= max) return false
  counts.set(key, n + 1)
  return true
}

const selected = []
const themeIndex = new Map()
const themeId = (t) => {
  if (!themeIndex.has(t)) themeIndex.set(t, themeIndex.size)
  return themeIndex.get(t)
}

const lines = createInterface({ input: process.stdin })
let seen = 0
for await (const line of lines) {
  if (seen++ === 0 && line.startsWith('PuzzleId')) continue
  if (seen % 500000 === 0) console.log(`${seen} satır, ${selected.length} seçildi`)
  const [id, fen, moves, rating, rd, popularity, plays, themesStr] = line.split(',')
  const r = +rating
  if (+popularity < 80 || +plays < 300 || +rd > 85) continue
  const themes = themesStr.split(' ')
  const skill = skillOf(themes)
  const b = bucketOf(r)
  let keep = take(`${skill}:${b}`, PER_SKILL_BUCKET[skill])
  for (const t of themes) {
    if (LESSON_THEMES.includes(t) && take(`t:${t}:${b >> 1}`, PER_THEME_BUCKET)) keep = true
  }
  if (keep) selected.push([id, fen, moves, r, skill, themes.map(themeId)])
}

const skills = ['tactics', 'mates', 'endgame', 'calculation', 'opening']
const out = {
  source: 'Lichess puzzle database (CC0) — https://database.lichess.org/#puzzles',
  themes: [...themeIndex.keys()],
  skills,
  // [id, fen, uciMoves, rating, skillIndex, themeIndexes]
  puzzles: selected.map(([id, fen, moves, r, skill, th]) => [id, fen, moves, r, skills.indexOf(skill), th]),
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`Bitti: ${seen} satır tarandı, ${selected.length} bulmaca yazıldı.`)
