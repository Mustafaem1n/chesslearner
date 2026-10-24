/**
 * Açılış repertuvarı. Hatlar PGN benzeri yazılır: "e4 {açıklama} e5 Nf3 …"
 * Süslü parantez içindeki açıklama kendinden önceki hamleye aittir.
 */
export interface OpeningLine {
  id: string
  name: string
  pgn: string
  /** Kursun tarafından farklıysa (tuzaklar kursu) */
  side?: 'w' | 'b'
}

export interface OpeningCourse {
  id: string
  name: string
  side: 'w' | 'b'
  stage: number
  description: string
  /** Tuzak hatlarında rakip bilerek hata yapar; motor doğrulaması atlanır */
  trap?: boolean
  lines: OpeningLine[]
}

export const OPENING_COURSES: OpeningCourse[] = [
  {
    id: 'italian',
    name: 'İtalyan Oyunu ve 1.e4 repertuvarı',
    side: 'w',
    stage: 1,
    description: 'Beyazla 1.e4: İtalyan Oyunu ve siyahın ana savunmalarına karşı sade, prensipli cevaplar.',
    lines: [
      {
        id: 'giuoco',
        name: 'Giuoco Piano: sakin ana hat',
        pgn: "e4 {Merkezi tutar, fil ve vezire yol açar.} e5 Nf3 {Gelişirken e5'e saldırır.} Nc6 Bc4 {Fil zayıf f7 karesini hedefler: İtalyan Oyunu.} Bc5 c3 {d4 ilerlemesini hazırlar.} Nf6 d3 {Sağlam yaklaşım: e4'ü korur (Giuoco Pianissimo).} d6 O-O O-O Re1 {Kale e sütununa geçer, e4'ü destekler.} a6 a4 {...b5 genişlemesini engeller, file a2 kaçış karesi kalır.} Ba7 Nbd2 {At f1–g3 manevrasıyla şah kanadına gelecek.}",
      },
      {
        id: 'two-knights',
        name: 'İki At Savunması: d3 sistemi',
        pgn: "e4 e5 Nf3 Nc6 Bc4 Nf6 {İki At Savunması: siyah e4'e saldırıyor.} d3 {e4'ü sağlamca korur; erken Ng5 maceralarına gerek yok.} Be7 O-O O-O Re1 d6 c3 {d4 hazırlığı, file de c2'de geri çekilme yolu açar.} Na5 Bb5 {Fil korunur; a6 gelince a4'e çekilir.} a6 Ba4 b5 Bc2 {Fil uzun çaprazda güvende.}",
      },
      {
        id: 'hungarian',
        name: 'Macar Savunması (3...Be7)',
        pgn: "e4 e5 Nf3 Nc6 Bc4 Be7 {Pasif ama sağlam.} d4 {Merkezi hemen aç.} d6 Nc3 Nf6 h3 {...Bg4 bağlamasını önler.} O-O O-O",
      },
      {
        id: 'philidor',
        name: 'Philidor Savunması (2...d6)',
        pgn: "e4 e5 Nf3 d6 {Sağlam ama pasif.} d4 {Merkezde alan kazan.} exd4 Nxd4 Nf6 Nc3 Be7 Bc4 {Aktif fil.} O-O O-O",
      },
      {
        id: 'petrov',
        name: 'Petrov Savunması (2...Nf6)',
        pgn: "e4 e5 Nf3 Nf6 {Simetrik savunma.} Nxe5 d6 {Önce ...d6! Hemen ...Nxe4?? Qe2 ile siyah taş kaybeder.} Nf3 Nxe4 d4 d5 Bd3 {Gelişim ve merkez.}",
      },
      {
        id: 'alapin-nf6',
        name: 'Sicilya: Alapin 2...Nf6',
        pgn: "e4 c5 {Sicilya Savunması.} c3 {Alapin: d4 ile tam merkez kurmak ister.} Nf6 e5 Nd5 d4 cxd4 Nf3 {Piyonu geri almadan önce gelişim.} Nc6 cxd4 d6 Bc4 {d5'teki ata baskı.} Nb6 Bb5 {Bağlama ile e5 piyonunu dolaylı korur.}",
      },
      {
        id: 'alapin-d5',
        name: 'Sicilya: Alapin 2...d5',
        pgn: 'e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 e6 Be2 Nc6 O-O cxd4 cxd4 {İzole vezir piyonu: alan ve aktif taşlar beyazın.}',
      },
      {
        id: 'french-advance',
        name: 'Fransız: İlerleme Varyantı',
        pgn: "e4 e6 {Fransız Savunması.} d4 d5 e5 {Alan kazanır; siyah atı f6'dan uzak tutar.} c5 c3 {d4'ü destekler.} Nc6 Nf3 Qb6 {d4 ve b2'ye baskı.} a3 {b4 ile alan kazanmayı hazırlar, ...Nb4'ü önler.}",
      },
      {
        id: 'caro-advance',
        name: 'Caro-Kann: İlerleme Varyantı',
        pgn: 'e4 c6 {Caro-Kann.} d4 d5 e5 Bf5 {Siyahın açık kareli fili zincirin dışına çıkar.} Nf3 e6 Be2 c5 Be3 {d4\'ü destekler.}',
      },
      {
        id: 'scandi',
        name: 'İskandinav Savunması',
        pgn: 'e4 d5 exd5 Qxd5 Nc3 {Vezire tempo kazanarak saldır.} Qa5 d4 Nf6 Nf3 Bf5 Bc4 e6 Bd2 {Nd5 tehditlerini hazırlar.}',
      },
      {
        id: 'pirc',
        name: 'Pirc / Modern',
        pgn: 'e4 d6 d4 Nf6 Nc3 g6 Be3 {Qd2 ve Bh6 ile g7 filini değişme planı.} Bg7 Qd2 O-O O-O-O {Karşı kanatlara rok: piyon fırtınası.}',
      },
    ],
  },
  {
    id: 'black-e5',
    name: 'Siyahla 1.e4 e5',
    side: 'b',
    stage: 1,
    description: 'Klasik ve sağlam: beyazın ana denemelerine karşı 1...e5 repertuvarı.',
    lines: [
      {
        id: 'vs-italian',
        name: 'İtalyan Oyununa karşı',
        pgn: "e4 e5 {Simetrik ve klasik.} Nf3 Nc6 {e5'i korur.} Bc4 Bc5 {Giuoco Piano.} c3 Nf6 {e4'e saldırı.} d3 d6 O-O O-O Re1 a6 {File a7 kaçış karesi.}",
      },
      {
        id: 'vs-ruy',
        name: 'İspanyol: Kapalı varyant',
        pgn: 'e4 e5 Nf3 Nc6 Bb5 {İspanyol (Ruy Lopez).} a6 {Morphy Savunması: file niyetini sorar.} Ba4 Nf6 O-O Be7 {Kapalı İspanyol.} Re1 b5 Bb3 d6 c3 O-O h3 {...Bg4 bağlamasını önler.} Na5 {Fili değişmeye gider.} Bc2 c5',
      },
      {
        id: 'vs-ruy-exchange',
        name: 'İspanyol: Değişme varyantı',
        pgn: "e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 {Değişme varyantı.} dxc6 {Merkeze doğru alırsın, fillerinin yolu açılır.} O-O f6 {e5'i sağlamca korur.} d4 exd4 Nxd4 c5 {Ata saldır.} Nb3 Qxd1 Rxd1 Bd6",
      },
      {
        id: 'vs-scotch',
        name: 'İskoç Oyununa karşı',
        pgn: "e4 e5 Nf3 Nc6 d4 {İskoç Oyunu.} exd4 Nxd4 Nf6 {Hemen e4'e saldır.} Nxc6 bxc6 e5 Qe7 {e5'e baskı.} Qe2 Nd5 c4 Ba6 {c4'e açmaz.}",
      },
      {
        id: 'vs-vienna',
        name: 'Viyana Oyununa karşı',
        pgn: 'e4 e5 Nc3 {Viyana Oyunu.} Nf6 f4 d5 {Merkezden karşılık en iyisidir.} fxe5 Nxe4 Nf3 Be7 d3 Nxc3 bxc3 O-O',
      },
      {
        id: 'vs-kings-gambit',
        name: 'Şah Gambitine karşı (Falkbeer)',
        pgn: 'e4 e5 f4 {Şah Gambiti.} d5 {Falkbeer karşı gambiti: merkezden karşılık.} exd5 exf4 Nf3 Nf6 Bc4 Nxd5',
      },
      {
        id: 'vs-bishops',
        name: 'Fil Açılışına karşı',
        pgn: "e4 e5 Bc4 Nf6 {e4'e saldır.} d3 c6 {...d5 hazırlığı.} Nf3 d5 Bb3 Bd6",
      },
    ],
  },
  {
    id: 'black-qgd',
    name: 'Siyahla Vezir Gambiti Reddi',
    side: 'b',
    stage: 2,
    description: '1.d4 d5 ve ...e6: yüzyıllardır en güvenilir savunmalardan biri.',
    lines: [
      {
        id: 'orthodox',
        name: 'Ortodoks / Tartakower',
        pgn: 'd4 d5 c4 {Vezir Gambiti.} e6 {Reddedilmiş Vezir Gambiti: sağlam merkez.} Nc3 Nf6 Bg5 Be7 {Açmazı kaldırır.} e3 O-O Nf3 h6 Bh4 b6 {Tartakower sistemi: c8 fili b7\'den çıkar.}',
      },
      {
        id: 'exchange',
        name: 'Değişme varyantı (Carlsbad)',
        pgn: 'd4 d5 c4 e6 Nc3 Nf6 cxd5 {Değişme varyantı: Carlsbad yapısı.} exd5 Bg5 c6 Qc2 Be7 e3 Nbd7 {f6 atını destekler.} Bd3 O-O Nf3 Re8 O-O Nf8 {Klasik manevra: at g6\'ya gelip şahı korur.}',
      },
      {
        id: 'vs-london',
        name: 'Londra Sistemine karşı',
        pgn: 'd4 d5 Bf4 {Londra Sistemi.} Nf6 e3 c5 {Merkeze karşı hamle.} c3 Nc6 Nd2 e6 Ngf3 Bd6 {Londra filine karşı çıkar.}',
      },
      {
        id: 'vs-catalan',
        name: 'Katalan\'a karşı',
        pgn: 'd4 d5 c4 e6 Nf3 Nf6 g3 {Katalan.} Be7 Bg2 O-O O-O dxc4 {Açık Katalan: piyonu al, gerekirse geri ver.} Qc2 a6 Qxc4 b5 Qc2 Bb7',
      },
    ],
  },
  {
    id: 'london',
    name: 'Londra Sistemi (alternatif beyaz)',
    side: 'w',
    stage: 2,
    description: 'Az ezber, sağlam yapı: aynı kurulum hemen her savunmaya karşı oynanır.',
    lines: [
      {
        id: 'main',
        name: 'Ana kurulum: ...d5 ve ...e6',
        pgn: 'd4 d5 Bf4 {Fil, piyon zincirinin dışına erken çıkar.} Nf6 e3 e6 Nf3 c5 c3 {Sağlam piyon üçgeni.} Nc6 Nbd2 Bd6 Bg3 {Fil değişirse h sütunu açılır.} O-O Bd3',
      },
      {
        id: 'vs-kid',
        name: 'Şah Hint kurulumuna karşı',
        pgn: 'd4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O Be2 d6 h3 {File h2 kaçış karesi.} c5 c3',
      },
      {
        id: 'vs-c5',
        name: 'Erken ...c5\'e karşı',
        pgn: 'd4 d5 Bf4 c5 e3 Nc6 c3 Nf6 Nd2 e6 Ngf3 Bd6 Bg3 O-O Bd3',
      },
    ],
  },
  {
    id: 'traps',
    name: 'Açılış tuzakları',
    side: 'w',
    stage: 1,
    trap: true,
    description: 'Gerçek oyunlarda sık görülen tuzaklar: hem kurmak hem de düşmemek için.',
    lines: [
      {
        id: 'legal',
        name: 'Legal tuzağı',
        pgn: 'e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 {Hata! Şimdi tuzak var.} Nxe5 {Vezir feda!} Bxd1 Bxf7+ Ke7 Nd5# {Legal matı.}',
      },
      {
        id: 'fried-liver',
        name: 'Ciğer kızartması (Fried Liver)',
        pgn: "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 {f7'ye saldırı.} d5 exd5 Nxd5 {Hata: ...Na5 gerekirdi.} Nxf7 {Fedakârlık!} Kxf7 Qf3+ Ke6 Nc3 {d5 atına baskı; siyah şah merkezde mahsur.}",
      },
      {
        id: 'blackburne',
        name: 'Blackburne Shilling tuzağı',
        side: 'b',
        pgn: "e4 e5 Nf3 Nc6 Bc4 Nd4 {Tuzak hamlesi (teorik olarak şüpheli).} Nxe5 {Açgözlü!} Qg5 {Hem e5 atına hem g2'ye saldırı.} Nxf7 Qxg2 Rf1 Qxe4+ Be2 Nf3# {Boğmaca mat!}",
      },
      {
        id: 'englund',
        name: 'Englund gambiti tuzağı',
        side: 'b',
        pgn: 'd4 e5 {Englund gambiti.} dxe5 Nc6 Nf3 Qe7 Bf4 {Doğal ama hatalı.} Qb4+ Bd2 Qxb2 Bc3 {Hata!} Bb4 {Fili bağlar.} Qd2 Bxc3 Qxc3 Qc1# {Mat!}',
      },
      {
        id: 'elephant',
        name: 'Fil tuzağı (Vezir Gambiti)',
        side: 'b',
        pgn: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 {Tuzağı kurar.} cxd5 exd5 Nxd5 {Piyon kazandığını sanıyor.} Nxd5 {Vezir feda!} Bxd8 Bb4+ Qd2 Bxd2+ Kxd2 Kxd8 {Siyah bir taş önde.}',
      },
      {
        id: 'noahs-ark',
        name: 'Nuh\'un Gemisi tuzağı',
        side: 'b',
        pgn: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 d6 d4 b5 Bb3 Nxd4 Nxd4 exd4 Qxd4 {Hata!} c5 Qd5 Be6 Qc6+ Bd7 Qd5 c4 {Fil hapsoldu.}',
      },
      {
        id: 'scholar-defense',
        name: 'Çoban matına karşı savunma',
        side: 'b',
        pgn: "e4 e5 Qh5 Nc6 Bc4 g6 {f7 güvende ve vezir kovalanıyor.} Qf3 Nf6 {f7'yi tekrar korur ve gelişir.}",
      },
    ],
  },
]

export interface ParsedLine {
  sans: string[]
  notes: (string | undefined)[]
}

export function parseLine(pgn: string): ParsedLine {
  const sans: string[] = []
  const notes: (string | undefined)[] = []
  const re = /\{([^}]*)\}|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(pgn))) {
    if (m[1] !== undefined) notes[sans.length - 1] = m[1].trim()
    else {
      sans.push(m[2])
      notes.push(undefined)
    }
  }
  return { sans, notes }
}

export const lineSide = (c: OpeningCourse, l: OpeningLine) => l.side ?? c.side
export const lineCardId = (c: OpeningCourse, l: OpeningLine) => `op:${c.id}:${l.id}`
export const courseById = (id: string) => OPENING_COURSES.find((c) => c.id === id)
