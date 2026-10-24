import type { Stage } from './types'

export const STAGE5: Stage = {
  id: 5,
  title: 'Uzman',
  description: 'Uzun hesaplama, teorik oyunsonları ve usta seviyesi kombinasyonlar.',
  units: [
    {
      id: 'u5-long-calc',
      stage: 5,
      title: 'Uzun hesaplama',
      summary: '5 ve daha fazla hamlelik zorlayıcı varyantlar.',
      skills: ['calculation'],
      steps: [
        {
          type: 'text',
          title: 'Görselleştirme',
          text: 'Uzun varyantlarda zorluk hesaplamak değil, **son pozisyonu net görmektir**. İpuçları: her varyantı bir kez baştan sona tek seferde hesapla, geri dönüp "dallanma" yapma; ara pozisyonlarda taşların yerini sesli say; varyantın sonunda "rakibin bir sessiz hamlesi var mı?" diye kontrol et. Ayrıca **Görselleştirme** antrenmanını düzenli yap.',
          moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O',
        },
        { type: 'puzzles', text: 'Pratik: çok uzun kombinasyonlar.', themes: ['veryLong'], count: 6 },
        { type: 'puzzles', text: 'Pratik: 4+ hamlede mat.', themes: ['mateIn4', 'mateIn5'], count: 4 },
      ],
      exam: { themes: ['veryLong', 'mateIn4'], count: 8, pass: 0.6 },
    },
    {
      id: 'u5-kbnk',
      stage: 5,
      title: 'Fil ve at ile mat',
      summary: 'En zor temel mat: doğru köşe ve W manevrası.',
      skills: ['endgame', 'mates'],
      steps: [
        {
          type: 'text',
          title: 'Doğru köşe',
          text: 'Fil ve atla yalnızca **filin rengindeki köşede** mat edilir. Plan: 1) rakip şahı kenara it, 2) yanlış köşeye kaçarsa atla "W" şeklinde manevra yaparak (ör. Nf7–e5–d7–c5…) şahı doğru köşeye sür, 3) mat ağını kur. 50 hamle kuralı içinde bitirmek gerekir.',
          fen: '8/8/8/4k3/8/8/8/1N2KB2 w - - 0 1',
        },
        { type: 'halfgame', endgameId: 'eg-kbnk' },
      ],
    },
    {
      id: 'u5-endgames',
      stage: 5,
      title: 'Taş oyunsonları',
      summary: 'Vezir, fil ve at oyunsonlarında ileri teknik.',
      skills: ['endgame'],
      steps: [
        {
          type: 'text',
          title: 'Taşa göre plan',
          text: '**Vezir oyunsonları:** sürekli şah tehlikesi; şahını güvenli tut, serbest piyonu vezirle destekle. **Fil oyunsonları:** zıt renkli fillerde beraberlik eğilimi yüksek; aynı renkte piyonlarını filinin tersine diz. **At oyunsonları:** piyon oyunsonlarına benzer, şah aktifliği ve uzak serbest piyon belirleyicidir.',
          fen: '8/5k2/8/3b4/8/2B5/5K2/8 w - - 0 1',
        },
        { type: 'puzzles', text: 'Pratik: vezir oyunsonları.', themes: ['queenEndgame'], count: 4 },
        { type: 'puzzles', text: 'Pratik: fil ve at oyunsonları.', themes: ['bishopEndgame', 'knightEndgame'], count: 6 },
      ],
      exam: { themes: ['queenEndgame', 'bishopEndgame', 'knightEndgame'], count: 6, pass: 0.6 },
    },
    {
      id: 'u5-master',
      stage: 5,
      title: 'Usta kombinasyonları',
      summary: 'Usta oyunlarından zorlu pozisyonlar.',
      skills: ['tactics', 'calculation'],
      steps: [
        {
          type: 'text',
          title: 'Ustalar gibi düşün',
          text: 'Usta oyunlarındaki kombinasyonlar genellikle birden fazla motifin birleşimidir: bir saptırma bir açmazı, bir açarak saldırı bir matı hazırlar. Pozisyondaki **tüm zayıflıkları** (korumasız taşlar, aşırı yüklenmiş savunucular, açık şah) listeleyerek başla.',
          moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8',
        },
        { type: 'puzzles', text: 'Pratik: usta oyunları.', themes: ['master', 'masterVsMaster'], count: 8 },
      ],
      exam: { themes: ['master', 'masterVsMaster', 'sacrifice'], count: 8, pass: 0.55 },
    },
    {
      id: 'u5-defense',
      stage: 5,
      title: 'İleri savunma',
      summary: 'Tek kurtaran hamleyi bulmak ve zugzwang savaşları.',
      skills: ['calculation', 'strategy'],
      steps: [
        {
          type: 'text',
          title: 'Savunma da hesaplamadır',
          text: 'Kötü pozisyonlarda en sık hata pes etmek ya da "umut hamlesi" oynamaktır. Rakibin en güçlü planını bul, onu durduran tüm hamleleri listele ve en az taviz vereni seç. Bazen tek kurtuluş karşı fedakârlık ya da pat hilesidir.',
          moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7',
        },
        { type: 'puzzles', text: 'Pratik: savunma.', themes: ['defensiveMove'], count: 6 },
        { type: 'puzzles', text: 'Pratik: zugzwang.', themes: ['zugzwang'], count: 4 },
      ],
      exam: { themes: ['defensiveMove', 'zugzwang'], count: 6, pass: 0.55 },
    },
  ],
}
