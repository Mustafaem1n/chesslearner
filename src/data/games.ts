/** "Hamleyi tahmin et" için telifsiz klasik oyunlar */
export interface ClassicGame {
  id: string
  white: string
  black: string
  event: string
  /** Kullanıcının tahmin edeceği taraf (genellikle kazanan) */
  side: 'w' | 'b'
  rating: number
  intro: string
  pgn: string
}

export const CLASSIC_GAMES: ClassicGame[] = [
  {
    id: 'opera',
    white: 'Paul Morphy',
    black: 'Brunswick Dükü ve Kont Isouard',
    event: 'Paris Operası, 1858',
    side: 'w',
    rating: 900,
    intro: 'Gelişimin ve açık hatların gücünü gösteren en öğretici oyunlardan biri. Morphy her hamlede yeni bir taş geliştirir.',
    pgn: 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#',
  },
  {
    id: 'reti-tartakower',
    white: 'Richard Réti',
    black: 'Savielly Tartakower',
    event: 'Viyana, 1910',
    side: 'w',
    rating: 1100,
    intro: 'Caro-Kann\'da merkezde kalan şaha karşı 11 hamlelik bir mucize: vezir fedası ve çifte şah.',
    pgn: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nf6 Qd3 e5 dxe5 Qa5+ Bd2 Qxe5 O-O-O Nxe4 Qd8+ Kxd8 Bg5+ Kc7 Bd8#',
  },
  {
    id: 'lasker-thomas',
    white: 'Edward Lasker',
    black: 'George Thomas',
    event: 'Londra, 1912',
    side: 'w',
    rating: 1400,
    intro: 'Tarihin en ünlü şah avı: vezir fedasından sonra siyah şah h8\'den g1\'e kadar sürülür.',
    pgn: 'd4 e6 Nf3 f5 Nc3 Nf6 Bg5 Be7 Bxf6 Bxf6 e4 fxe4 Nxe4 b6 Ne5 O-O Bd3 Bb7 Qh5 Qe7 Qxh7+ Kxh7 Nxf6+ Kh6 Neg4+ Kg5 h4+ Kf4 g3+ Kf3 Be2+ Kg2 Rh2+ Kg1 Kd2#',
  },
  {
    id: 'immortal',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    event: 'Londra, 1851 — "Ölümsüz Oyun"',
    side: 'w',
    rating: 1600,
    intro: 'Romantik dönemin simgesi: beyaz iki kale, bir fil ve veziri feda edip üç küçük taşla mat eder.',
    pgn: 'e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8 Qf6+ Nxf6 Be7#',
  },
  {
    id: 'evergreen',
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    event: 'Berlin, 1852 — "Her Daim Yeşil"',
    side: 'w',
    rating: 1700,
    intro: 'Evans Gambiti\'nden doğan saldırı; 19.Rad1!! ve ardından gelen muhteşem mat ağı.',
    pgn: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O d3 Qb3 Qf6 e5 Qg6 Re1 Nge7 Ba3 b5 Qxb5 Rb8 Qa4 Bb6 Nbd2 Bb7 Ne4 Qf5 Bxd3 Qh5 Nf6+ gxf6 exf6 Rg8 Rad1 Qxf3 Rxe7+ Nxe7 Qxd7+ Kxd7 Bf5+ Ke8 Bd7+ Kf8 Bxe7#',
  },
  {
    id: 'game-of-century',
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    event: 'New York, 1956 — "Yüzyılın Oyunu"',
    side: 'b',
    rating: 2000,
    intro: '13 yaşındaki Fischer siyahla oynuyor. 17...Be6!! ile veziri feda eder ve taşlarıyla rakip şahı avlar.',
    pgn: 'Nf3 Nf6 c4 g6 Nc3 Bg7 d4 O-O Bf4 d5 Qb3 dxc4 Qxc4 c6 e4 Nbd7 Rd1 Nb6 Qc5 Bg4 Bg5 Na4 Qa3 Nxc3 bxc3 Nxe4 Bxe7 Qb6 Bc4 Nxc3 Bc5 Rfe8+ Kf1 Be6 Bxb6 Bxc4+ Kg1 Ne2+ Kf1 Nxd4+ Kg1 Ne2+ Kf1 Nc3+ Kg1 axb6 Qb4 Ra4 Qxb6 Nxd1 h3 Rxa2 Kh2 Nxf2 Re1 Rxe1 Qd8+ Bf8 Nxe1 Bd5 Nf3 Ne4 Qb8 b5 h4 h5 Ne5 Kg7 Kg1 Bc5+ Kf1 Ng3+ Ke1 Bb4+ Kd1 Bb3+ Kc1 Ne2+ Kb1 Nc3+ Kc1 Rc2#',
  },
]
