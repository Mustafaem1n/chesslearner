import type { Skill } from '../core/rating'

/**
 * Yarım oyun: kullanıcı belirli bir hedefe ulaşmak için motora karşı oynar.
 * - mate: hamle sınırı içinde mat et
 * - win: ezici, teknik olarak kazanılmış bir pozisyona ulaş (ya da mat et)
 * - promote: piyonu terfi ettir ve yeni vezir hayatta kalsın
 * - draw: hamle sınırı boyunca kaybetmeden dayan (ya da beraberliği zorla)
 */
export interface HalfGame {
  id: string
  title: string
  fen: string
  goal: 'mate' | 'win' | 'promote' | 'draw'
  /** Kullanıcı hamlesi sınırı */
  moveLimit: number
  rating: number
  skills: Skill[]
  description: string
  hints?: string[]
}

export const ENDGAMES: HalfGame[] = [
  // ---- Temel matlar ----
  {
    id: 'eg-kqk',
    title: 'Vezir + Şah ile mat',
    fen: '8/8/8/4k3/8/8/8/3QK3 w - - 0 1',
    goal: 'mate',
    moveLimit: 14,
    rating: 600,
    skills: ['endgame', 'mates'],
    description: 'Veziri atın hareketiyle şahın kaçabileceği alanı daralt, sonra kendi şahını getirip mat et.',
    hints: [
      'Vezirini rakip şahtan bir at sıçrayışı uzağa koy: alan her hamlede küçülür.',
      'Şah kenara sıkışınca dur: pat yapmamak için rakibe her zaman bir kare bırak.',
      'Son aşamada kendi şahını yaklaştır ve vezirle kenarda mat et.',
    ],
  },
  {
    id: 'eg-krr',
    title: 'İki kale ile merdiven matı',
    fen: '8/8/8/4k3/8/8/8/R3K2R w - - 0 1',
    goal: 'mate',
    moveLimit: 12,
    rating: 450,
    skills: ['endgame', 'mates'],
    description: 'Kaleler sırayla bir satırı ve bir sonrakini keserek şahı kenara iter.',
    hints: [
      'Bir kale şahın satırını keser, diğeri bir sonraki satıra şah çeker.',
      'Şah kaleye yaklaşırsa kaleyi tahtanın öbür ucuna götür.',
    ],
  },
  {
    id: 'eg-krk',
    title: 'Kale + Şah ile mat',
    fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1',
    goal: 'mate',
    moveLimit: 28,
    rating: 850,
    skills: ['endgame', 'mates'],
    description: 'Kale bir hattı keser, şahlar karşı karşıya gelince (opozisyon) kale şah çekerek alanı daraltır.',
    hints: [
      'Kale ile rakip şahı bir kutuya hapset ve kutuyu küçült.',
      'Şahını rakip şahın karşısına getir; şahlar karşı karşıyayken kaleyle şah çek.',
      'Rakip şah kaleye saldırırsa kaleyi uzaklaştır ama hattı bırakma.',
    ],
  },
  {
    id: 'eg-kbbk',
    title: 'İki fil ile mat',
    fen: '8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1',
    goal: 'mate',
    moveLimit: 30,
    rating: 1500,
    skills: ['endgame', 'mates'],
    description: 'Filler yan yana iki çapraz duvar oluşturur; şah yardımıyla rakip şahı köşeye sürersin.',
    hints: ['Filleri yan yana tut: birlikte geçilmez bir çapraz duvar örerler.', 'Mat ancak köşede olur.'],
  },
  {
    id: 'eg-kbnk',
    title: 'Fil + At ile mat',
    fen: '8/8/8/4k3/8/8/8/1N2KB2 w - - 0 1',
    goal: 'mate',
    moveLimit: 45,
    rating: 2000,
    skills: ['endgame', 'mates'],
    description: 'Yalnızca filin rengindeki köşede mat olur. Önce şahı kenara it, sonra "W manevrası" ile doğru köşeye taşı.',
    hints: [
      'Filin beyaz karelerde: mat a8 ya da h1 köşesinde olacak.',
      'Şahı yanlış köşeden doğru köşeye at ile W çizerek taşı.',
    ],
  },
  // ---- Piyon oyunsonları ----
  {
    id: 'eg-kp-sixth',
    title: 'Şah 6. sırada: kazanç',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    goal: 'promote',
    moveLimit: 8,
    rating: 700,
    skills: ['endgame'],
    description: 'Şahın piyonunun önünde ve 6. sıradaysa (kale piyonu hariç) pozisyon her zaman kazanılır.',
    hints: ['Şahını piyonun yanına (d6 ya da f6) götür.', 'Piyonu kendi şahının koruması altında ilerlet.'],
  },
  {
    id: 'eg-kp-key',
    title: 'Kilit kareler',
    fen: '8/8/3k4/8/4K3/8/4P3/8 w - - 0 1',
    goal: 'promote',
    moveLimit: 14,
    rating: 1000,
    skills: ['endgame'],
    description:
      'e2 piyonu için kilit kareler d4, e4, f4. Şahın bunlardan birindeyse kazanırsın — ama dikkat, Kd3 gibi geri hamleler beraberliğe gider.',
    hints: [
      'Şahını piyondan önce götür; piyonu acele sürme.',
      'Yedek piyon hamlesi (e2-e3) opozisyonu kazanmak için zaman kazandırır.',
    ],
  },
  {
    id: 'eg-kp-opp-defend',
    title: 'Opozisyonla savun',
    fen: '8/8/4k3/8/4PK2/8/8/8 b - - 0 1',
    goal: 'draw',
    moveLimit: 12,
    rating: 1100,
    skills: ['endgame'],
    description: 'Siyahla oynuyorsun. Tek kurtaran hamle var: rakip şahın karşısına geç (opozisyon) ve onu koru.',
    hints: ['Şahları aynı hatta, aralarında bir kare olacak şekilde karşı karşıya getir.'],
  },
  {
    id: 'eg-square',
    title: 'Kare kuralı',
    fen: '7k/8/8/p7/8/8/8/5K2 w - - 0 1',
    goal: 'draw',
    moveLimit: 8,
    rating: 800,
    skills: ['endgame'],
    description: 'a5 piyonu terfiye koşuyor. Şahın piyonun "karesine" girebiliyorsa yakalarsın.',
    hints: ['Piyondan terfi karesine kadar bir kare çiz: a5–e5–e1–a1. Şahın bu kareye girmeli.'],
  },
  // ---- Kale oyunsonları ----
  {
    id: 'eg-lucena',
    title: 'Lucena pozisyonu',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    goal: 'promote',
    moveLimit: 14,
    rating: 1550,
    skills: ['endgame'],
    description: 'Kale oyunsonlarının en önemli kazanç tekniği: "köprü kurmak". Kaleni 4. sıraya getirip şahını yan şahlardan koru.',
    hints: [
      'Önce kaleyle şah çekip rakip şahı bir hat daha uzaklaştır (Rd1+).',
      'Kaleyi 4. sıraya getir (Rd4): şahın çıkınca yan şahlara karşı köprü olacak.',
    ],
  },
  {
    id: 'eg-philidor',
    title: 'Philidor savunması',
    fen: '4k3/7R/r7/3KP3/8/8/8/8 b - - 0 1',
    goal: 'draw',
    moveLimit: 14,
    rating: 1700,
    skills: ['endgame'],
    description:
      'Siyahla oynuyorsun. Kaleni 6. sırada tut ki rakip şah ilerleyemesin; piyon e6\'ya gelince kaleyi geriye götürüp arkadan şah çek.',
    hints: ['Kale 6. sırada kalsın, beklerken sadece o sırada oyna.', 'Piyon 6. sıraya çıkınca kaleyle arkadan şah çekmeye başla.'],
  },
  {
    id: 'eg-q-vs-p',
    title: 'Vezir piyona karşı',
    fen: '6QK/8/8/8/8/8/3pk3/8 w - - 0 1',
    goal: 'win',
    moveLimit: 24,
    rating: 1400,
    skills: ['endgame'],
    description: 'Şahlar ve vezirle: rakip şahı piyonun önüne girmeye zorla, her seferinde kendi şahını bir adım yaklaştır.',
    hints: ['Şah çekerek ya da piyonu bağlayarak rakip şahı d1 karesine zorla.', 'Rakip şah piyonun önündeyken kendi şahınla bir adım yaklaş.'],
  },
]

export const endgameById = (id: string) => ENDGAMES.find((e) => e.id === id)

/** Aralıklı tekrar kart kimliği */
export const endgameCardId = (id: string) => `eg:${id}`
