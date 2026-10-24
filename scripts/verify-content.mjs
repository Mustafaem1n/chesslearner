// Elle yazılmış içeriği doğrular: FEN geçerliliği, hamle yasallığı ve Stockfish değerlendirmesi.
// Kullanım: node scripts/verify-content.mjs
import { Chess } from 'chess.js'
import { ENDGAMES } from '../src/data/endgames.ts'
import { OPENING_COURSES, parseLine, lineSide } from '../src/data/openings.ts'
import { STAGE1 } from '../src/data/curriculum/stage1.ts'
import { STAGE2 } from '../src/data/curriculum/stage2.ts'
import { STAGE4 } from '../src/data/curriculum/stage4.ts'
import { STAGE3 } from '../src/data/curriculum/stage3.ts'
import { startEngine } from './uci.mjs'

const engine = startEngine()
await engine.init()
let failures = 0
const fail = (msg) => {
  failures++
  console.log('  ✗ ' + msg)
}

console.log('Oyunsonları')
for (const g of ENDGAMES) {
  try {
    new Chess(g.fen)
  } catch (e) {
    fail(`${g.id}: geçersiz FEN (${e.message})`)
    continue
  }
  const r = await engine.analyse(g.fen, { depth: 20 })
  const v = engine.value(r.lines[0])
  // Tablebase'siz motor KBB/KBN gibi teorik kazançları düşük gösterir
  const ok = g.goal === 'draw' ? v >= -60 : v >= (g.goal === 'mate' ? 150 : 300)
  if (!ok) fail(`${g.id}: hedef ${g.goal} ama değerlendirme ${v}`)
  else console.log(`  ✓ ${g.id} (${g.goal}, ${r.lines[0].mate !== undefined ? 'M' + r.lines[0].mate : v})`)
}

// Kullanıcının açılış hamleleri ciddi hata olmamalı (tuzak kursu hariç)
console.log('\nAçılışlar')
for (const course of OPENING_COURSES.filter((c) => !c.trap)) {
  for (const line of course.lines) {
    const { sans } = parseLine(line.pgn)
    const side = lineSide(course, line)
    const chess = new Chess()
    let worst = 0
    let worstMove = ''
    for (const san of sans) {
      if (chess.turn() === side) {
        const fen = chess.fen()
        const best = await engine.analyse(fen, { depth: 14 })
        const mv = chess.move(san)
        const after = await engine.analyse(chess.fen(), { depth: 13 })
        const loss = engine.value(best.lines[0]) + engine.value(after.lines[0])
        if (loss > worst) {
          worst = loss
          worstMove = mv.san
        }
      } else chess.move(san)
    }
    if (worst > 110) fail(`${course.id}/${line.id}: ${worstMove} ${worst} cp kaybettiriyor`)
    else console.log(`  ✓ ${course.id}/${line.id} (en kötü ${worstMove || '-'} ${worst})`)
  }
}

// "Plan bul" adımlarında kabul edilen hamleler motorca makul olmalı
console.log('\nPlan adımları')
for (const stage of [STAGE1, STAGE2, STAGE3, STAGE4]) {
  for (const unit of stage.units) {
    for (const step of unit.steps) {
      if (step.type !== 'plan') continue
      const chess = new Chess()
      if (step.fen) chess.load(step.fen)
      else for (const san of (step.moves ?? '').split(/\s+/).filter(Boolean)) chess.move(san)
      const fen = chess.fen()
      const best = await engine.analyse(fen, { depth: 16 })
      for (const g of step.good) {
        const after = await engine.analyse(fen, { depth: 15, moves: [g] })
        const loss = engine.value(best.lines[0]) + engine.value(after.lines[0])
        if (loss > step.tolerance + 40) fail(`${unit.id}: ${g} ${loss} cp kaybettiriyor`)
        else console.log(`  ✓ ${unit.id} ${g} (${loss})`)
      }
    }
  }
}

engine.quit()
if (failures) {
  console.log(`\n${failures} hata`)
  process.exit(1)
}
console.log('\nTüm içerik geçerli.')
