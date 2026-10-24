# Satranç Öğretici

https://chesslearner.vercel.app

Seviyeni kısa ve **oynanarak yapılan** bir testle ölçen, sonra seni bulunduğun yerden adım adım yukarı taşıyan,
tamamen tarayıcıda çalışan bir satranç antrenörü.

## Özellikler

- **Seviye testi** — 12 adaptif pozisyon (bulmacalar + motora karşı oyunsonu), 6 beceri alanında puan ve radar
- **Müfredat** — 6 aşama, 37 ünite: ders → örnek → pratik → yarım oyun → ünite sınavı; aşama atlama sınavları
- **Bulmacalar** — 11 bin+ Lichess bulmacası, puana ve zayıf alana göre seçim, kademeli ipucu, motorla çürütme
- **Açılış antrenörü** — İtalyan, Londra, 1…e5, Vezir Gambiti Reddi ve tuzaklar; aralıklı tekrar (SM-2)
- **Oyunsonları** — Temel matlar, opozisyon, Lucena, Philidor… motora karşı
- **Günlük plan, hata defteri, seri** — yanlış çözülen her pozisyon aralıklarla tekrar sorulur
- **Ekstralar** — hız taktiği, hamleyi tahmin et, görselleştirme, motora karşı oyun + analiz, PGN içe aktarma
- **PWA** — çevrimdışı çalışır, telefona uygulama olarak eklenebilir

## Geliştirme

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # birim + içerik testleri
npm run verify     # Stockfish ile içerik doğrulaması
npm run build      # üretim derlemesi → dist/
```

Node 20.19+ gerekir. Bulmaca setini yeniden üretmek için (`curl` ve `zstd` gerekir, ~300 MB indirir):
`npm run puzzles`

## Yayınlama (Vercel)

Repoyu Vercel'e bağlaman yeterli; ayarlar `vercel.json` içinde (Vite, `npm run build`, çıktı `dist`).
Derleme sırasında Stockfish dosyaları `node_modules/stockfish` paketinden `public/stockfish/` altına kopyalanır.

## Teknoloji

React 19 + TypeScript + Vite · chess.js · react-chessboard · Stockfish 18 (WASM, Web Worker).
İlerleme tarayıcının `localStorage`'ında saklanır; sunucu yoktur. Ayarlar sayfasından yedek alınabilir.

## Kaynaklar ve lisanslar

- Bulmacalar: [Lichess bulmaca veritabanı](https://database.lichess.org/#puzzles) — CC0
- Motor: [Stockfish](https://github.com/official-stockfish/Stockfish) /
  [stockfish.js](https://github.com/nmrugg/stockfish.js) — GPLv3. Motor dosyaları değiştirilmeden dağıtılır;
  lisans metni yayında `/stockfish/COPYING.txt` adresindedir, kaynak kodu yukarıdaki bağlantılardadır.
