import { Chess, type Square } from 'chess.js'
import { useMemo, useState, type CSSProperties } from 'react'
import { Chessboard, defaultPieces, type Arrow } from 'react-chessboard'
import { checkedKingSquare, isPromotionMove, type Color, type MoveInput, type Promotion } from './moves'
import './board.css'

export type Highlight = 'good' | 'bad' | 'hint' | 'focus' | 'star'

export interface ChessBoardProps {
  fen: string
  /** Hamle önerildiğinde çağrılır; hamle kabul edildiyse true döndürmeli. */
  onMove?: (move: MoveInput) => boolean
  orientation?: 'white' | 'black'
  /** Kullanıcının oynayabileceği taraf. Varsayılan: sırası gelen taraf. */
  movable?: Color | 'both' | 'none'
  lastMove?: { from: string; to: string } | null
  arrows?: Arrow[]
  highlights?: Partial<Record<string, Highlight>>
  /**
   * Özel kurallar (ör. tek taşla "yıldız topla" oyunu): verilirse chess.js yerine
   * hedef kareleri bu fonksiyon belirler; FEN'de şah olması gerekmez.
   */
  legalTargets?: (from: Square) => Square[]
  /** Görselleştirme antrenmanı: taşlar görünmez ama kurallar geçerli */
  hidePieces?: boolean
}

const HIDDEN_PIECES = Object.fromEntries(Object.keys(defaultPieces).map((k) => [k, () => <svg viewBox="0 0 1 1" />]))

interface PieceInfo {
  color: Color
  type: string
}

/** chess.js'in kabul etmediği (şahsız vb.) öğretim pozisyonları için basit FEN okuyucu */
function parsePlacement(fen: string): Map<string, PieceInfo> {
  const map = new Map<string, PieceInfo>()
  const rows = fen.split(' ')[0].split('/')
  rows.forEach((row, i) => {
    let file = 0
    for (const ch of row) {
      if (/\d/.test(ch)) file += Number(ch)
      else {
        const sq = `${'abcdefgh'[file]}${8 - i}`
        map.set(sq, { color: ch === ch.toUpperCase() ? 'w' : 'b', type: ch.toLowerCase() })
        file++
      }
    }
  })
  return map
}

const HIGHLIGHT_STYLE: Record<Highlight, CSSProperties> = {
  good: { boxShadow: 'inset 0 0 0 4px var(--sq-good)' },
  bad: { boxShadow: 'inset 0 0 0 4px var(--sq-bad)' },
  hint: { backgroundColor: 'var(--sq-hint)' },
  focus: { boxShadow: 'inset 0 0 0 4px var(--sq-focus)' },
  star: {},
}

const PROMOTION_PIECES: { p: Promotion; label: string }[] = [
  { p: 'q', label: 'Vezir' },
  { p: 'r', label: 'Kale' },
  { p: 'b', label: 'Fil' },
  { p: 'n', label: 'At' },
]

export function ChessBoard({
  fen,
  onMove,
  orientation = 'white',
  movable,
  lastMove,
  arrows = [],
  highlights = {},
  legalTargets,
  hidePieces = false,
}: ChessBoardProps) {
  const chess = useMemo(() => {
    if (legalTargets) return null
    try {
      return new Chess(fen)
    } catch {
      return null
    }
  }, [fen, legalTargets])
  const placement = useMemo(() => (chess ? null : parsePlacement(fen)), [chess, fen])
  const [selected, setSelected] = useState<Square | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null)
  // Pozisyon değişince seçimi sıfırla (render sırasında, efekt kullanmadan)
  const [prevFen, setPrevFen] = useState(fen)
  if (fen !== prevFen) {
    setPrevFen(fen)
    setSelected(null)
    setPendingPromotion(null)
  }

  const turn: Color = chess ? chess.turn() : fen.split(' ')[1] === 'b' ? 'b' : 'w'
  const pieceAt = (sq: Square): PieceInfo | null => (chess ? (chess.get(sq) ?? null) : (placement!.get(sq) ?? null))
  const targetsFrom = (sq: Square): Square[] => {
    if (legalTargets) return legalTargets(sq)
    if (!chess) return []
    return chess.moves({ square: sq, verbose: true }).map((m) => m.to)
  }
  const canMoveColor = (c: Color) => {
    if (!onMove || movable === 'none') return false
    if (movable === 'both') return legalTargets ? true : c === turn
    return c === (movable ?? turn) && (legalTargets ? true : c === turn)
  }

  const targets = selected ? targetsFrom(selected) : []

  function attempt(from: Square, to: Square): boolean {
    if (!onMove) return false
    if (!targetsFrom(from).includes(to)) return false
    if (chess && isPromotionMove(fen, from, to)) {
      setPendingPromotion({ from, to })
      return false
    }
    setSelected(null)
    return onMove({ from, to })
  }

  function handleSquareClick(square: Square) {
    if (pendingPromotion) return
    const piece = pieceAt(square)
    if (selected && selected !== square && targets.includes(square)) {
      attempt(selected, square)
      return
    }
    if (piece && canMoveColor(piece.color) && selected !== square) {
      setSelected(square)
    } else {
      setSelected(null)
    }
  }

  // Her kare için arka plan katmanları tek bir `background` değerinde birleştirilir
  const layers: Record<string, string[]> = {}
  const extra: Record<string, CSSProperties> = {}
  const flat = (color: string) => `linear-gradient(${color}, ${color})`
  const layer = (sq: string, bg: string) => {
    ;(layers[sq] ??= []).unshift(bg)
  }
  if (lastMove) {
    layer(lastMove.from, flat('var(--sq-last)'))
    layer(lastMove.to, flat('var(--sq-last)'))
  }
  const kingSq = chess ? checkedKingSquare(chess) : null
  if (kingSq) layer(kingSq, 'radial-gradient(circle, var(--sq-check) 0%, transparent 75%)')
  if (selected) layer(selected, flat('var(--sq-selected)'))
  for (const t of targets) {
    layer(
      t,
      pieceAt(t)
        ? 'radial-gradient(circle, transparent 58%, var(--sq-target) 60%)'
        : 'radial-gradient(circle, var(--sq-target) 22%, transparent 24%)',
    )
  }
  for (const [sq, h] of Object.entries(highlights)) {
    if (!h) continue
    if (h === 'star') layer(sq, 'radial-gradient(circle, var(--sq-star) 26%, transparent 29%)')
    const { backgroundColor, ...rest } = HIGHLIGHT_STYLE[h]
    if (backgroundColor) layer(sq, flat(backgroundColor))
    extra[sq] = { ...extra[sq], ...rest }
  }
  const squareStyles: Record<string, CSSProperties> = {}
  for (const sq of new Set([...Object.keys(layers), ...Object.keys(extra)])) {
    const isLight = (sq.charCodeAt(0) - 97 + Number(sq[1])) % 2 === 0
    const base = isLight ? 'var(--sq-light)' : 'var(--sq-dark)'
    squareStyles[sq] = { ...extra[sq], background: [...(layers[sq] ?? []), flat(base)].join(', ') }
  }

  const promoColor = pendingPromotion ? (pieceAt(pendingPromotion.from)?.color ?? 'w') : 'w'

  return (
    <div className="board-wrap">
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          pieces: hidePieces ? HIDDEN_PIECES : defaultPieces,
          arrows,
          squareStyles,
          allowDrawingArrows: true,
          animationDurationInMs: 180,
          lightSquareStyle: { background: 'var(--sq-light)' },
          darkSquareStyle: { background: 'var(--sq-dark)' },
          lightSquareNotationStyle: { color: 'var(--sq-dark)' },
          darkSquareNotationStyle: { color: 'var(--sq-light)' },
          boardStyle: { borderRadius: 6, overflow: 'hidden' },
          canDragPiece: ({ piece }) => canMoveColor(piece.pieceType[0] as Color),
          onPieceDrag: ({ square }) => square && setSelected(square as Square),
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            targetSquare ? attempt(sourceSquare as Square, targetSquare as Square) : false,
          onSquareClick: ({ square }) => handleSquareClick(square as Square),
        }}
      />
      {pendingPromotion && (
        <div className="promo-overlay" onClick={() => setPendingPromotion(null)}>
          <div className="promo-box" onClick={(e) => e.stopPropagation()}>
            <span className="promo-title">Terfi</span>
            <div className="promo-choices">
              {PROMOTION_PIECES.map(({ p, label }) => (
                <button
                  key={p}
                  title={label}
                  onClick={() => {
                    const { from, to } = pendingPromotion
                    setPendingPromotion(null)
                    setSelected(null)
                    onMove?.({ from, to, promotion: p })
                  }}
                >
                  {defaultPieces[`${promoColor}${p.toUpperCase()}`]()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
