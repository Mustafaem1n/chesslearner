import type { Skill } from '../../core/rating'

export type ArrowSpec = [from: string, to: string, color?: 'green' | 'red' | 'blue' | 'yellow']

/** Pozisyon ya FEN ile ya da başlangıçtan oynanan SAN hamleleriyle verilir */
export interface PositionSpec {
  fen?: string
  /** Başlangıç pozisyonundan oynanacak hamleler, ör. "e4 e5 Nf3 Nc6" */
  moves?: string
}

export type LessonStep =
  /** Açıklama + (isteğe bağlı) gösterim tahtası */
  | ({
      type: 'text'
      title?: string
      text: string
      arrows?: ArrowSpec[]
      marks?: string[]
      orientation?: 'white' | 'black'
    } & PositionSpec)
  /** Kullanıcı belirli hamle(ler)i bulmalı; rakip cevapları senaryoda */
  | ({
      type: 'move'
      text: string
      setup?: string[]
      /** UCI; kullanıcı adımında alternatifler dizi olarak */
      solution: (string | string[])[]
      acceptAnyMate?: boolean
      wrongFeedback?: Record<string, string>
      comments?: string[]
    } & PositionSpec)
  /** Tek taşla yıldız toplama (şahsız, özel kurallar) */
  | { type: 'stars'; text: string; piece: 'R' | 'B' | 'Q' | 'K' | 'N' | 'P'; start: string; stars: string[]; par: number }
  /** Söylenen kareye tıklama oyunu */
  | { type: 'squares'; text: string; count: number }
  /** Veritabanından tema/beceri bazlı bulmacalar (pratik modu) */
  | { type: 'puzzles'; text: string; themes?: string[]; skill?: Skill; count: number; maxUserMoves?: number }
  /** Motora karşı yarım oyun */
  | { type: 'halfgame'; endgameId: string; text?: string }
  /** Motorla değerlendirilen "plan bul" pozisyonu */
  | ({
      type: 'plan'
      text: string
      /** Doğrudan kabul edilen hamleler (UCI) */
      good: string[]
      /** Kabul edilen santipiyon kaybı */
      tolerance: number
      explanation: string
    } & PositionSpec)

export interface UnitExam {
  themes?: string[]
  skill?: Skill
  count: number
  /** Geçme oranı (0–1) */
  pass: number
}

export interface Unit {
  id: string
  stage: number
  title: string
  summary: string
  skills: Skill[]
  steps: LessonStep[]
  exam?: UnitExam
}

export interface Stage {
  id: number
  title: string
  description: string
  units: Unit[]
}
