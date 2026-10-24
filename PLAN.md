# Satranç Öğretici — Proje Planı

## 1. Amaç

Kullanıcının seviyesini kısa ve **oynanarak yapılan** bir testle ölçen, sonra onu bulunduğu yerden
olabildiğince yükseğe çıkaran, kişiye uyarlanan bir satranç antrenörü.

Temel ilkeler:
- **Her şey tahtada.** Kullanıcı şık seçmez, hamle yapar. Bilgi, hamleyle ölçülür ve öğretilir.
- **Adaptif.** Her beceri alanı için ayrı bir puan tutulur, zorluk buna göre ayarlanır.
- **Tekrar ile kalıcılık.** Ezberlenmesi gerekenler (açılış hatları, teorik oyunsonları, mat kalıpları)
  aralıklı tekrar (spaced repetition) ile geri gelir.
- **Hatadan öğrenme.** Yanlış çözülen her pozisyon kişisel "hata defterine" girer ve tekrar sorulur.
- **Kısa ve günlük.** 15–30 dakikalık, hazır günlük antrenman planları.

---

## 2. Teknoloji

| Parça | Seçim | Neden |
|---|---|---|
| Uygulama | Vite + React + TypeScript | Hızlı geliştirme, tarayıcıda çalışır, kurulum gerektirmez |
| Kurallar | `chess.js` | Hamle doğrulama, FEN/PGN, mat/pat tespiti |
| Tahta | `react-chessboard` | Sürükle-bırak, oklar, kare vurgulama |
| Motor | Stockfish (WASM, Web Worker) | Hamle değerlendirme, yarım oyunlarda rakip, oyun analizi |
| Kayıt | `localStorage` (sonra istenirse IndexedDB) | Sunucusuz; ilerleme tarayıcıda kalır |
| Bulmacalar | Lichess bulmaca veritabanı (CC0) | Milyonlarca bulmaca, puanlı ve temalı; bir script ile alt küme çıkarılır |
| Testler | Vitest | Puanlama, SRS ve bulmaca doğrulama mantığı için |

Arayüz dili: **Türkçe**. Sunucu yok, `npm run dev` ile çalışır; istenirse sonra PWA yapılır (çevrimdışı/mobil).

---

## 3. Seviye ve Beceri Modeli

### Genel seviye bantları

| Aşama | Ad | Yaklaşık puan |
|---|---|---|
| 0 | Temeller | — (kuralları yeni öğrenen) |
| 1 | Başlangıç | 0–800 |
| 2 | Kulüp adayı | 800–1200 |
| 3 | Kulüp oyuncusu | 1200–1600 |
| 4 | İleri | 1600–2000 |
| 5 | Uzman | 2000+ |

### Beceri alanları (her biri için ayrı puan)

1. **Taktik** — çatal, açmaz, şiş, açarak saldırı, aşırı yükleme, saptırma…
2. **Mat kalıpları** — arka sıra, boğmaca mat, Anastasia, Arap matı, Boden…
3. **Hesaplama** — çok hamleli kombinasyonlar, zorlayıcı hamle dizileri
4. **Oyunsonu** — temel matlar, piyon oyunsonları, kale oyunsonları, teorik pozisyonlar
5. **Açılış** — prensipler, repertuvar, tuzaklar
6. **Strateji** — piyon yapıları, iyi/kötü fil, zayıf kareler, plan yapma

Puanlama: Glicko-2 benzeri sistem. Her bulmaca/egzersizin de bir puanı vardır; kullanıcı çözdükçe
iki taraf karşılıklı güncellenir. Genel seviye = alanların ağırlıklı ortalaması.

---

## 4. Seviye Belirleme Testi

**Hedef:** ~8–10 dakika, 12 pozisyon, tamamen hamle yaparak.

### Akış
1. **Ön soru (tek tık):** "Satranç kurallarını biliyor musun?" → Hayır ise doğrudan Aşama 0.
2. **Adaptif bulmaca serisi (10 pozisyon):** 1000 puandan başlar. Doğru → zorlaşır, yanlış → kolaylaşır
   (ikili arama mantığı; adım her soruda küçülür). Pozisyonlar beceri alanlarına dağıtılır:
   - 3 taktik, 2 mat kalıbı, 2 hesaplama, 2 oyunsonu, 1 strateji (motorla değerlendirilen "en iyi plan hamlesi")
3. **Açılış mini testi (1 pozisyon):** ilk 6–8 hamlede tipik bir prensip/tuzak anı — doğru hamleyi oyna.
4. **Uygulamalı oyunsonu (1 pozisyon):** örn. Vezir+Şah vs Şah'ı motora karşı N hamlede mat et, ya da
   kazanılmış bir piyon oyunsonunu kazan. Seviyeye göre seçilir.

### Değerlendirme
- Bulmacalarda: doğru hamle dizisi, **süre** ve **ipucu kullanımı** puana etki eder.
- Strateji pozisyonlarında: Stockfish ile, en iyi hamleye belli bir tolerans (ör. ≤ 50 cp kayıp) içindeki
  hamleler kabul edilir.
- Sonuç ekranı: genel tahmini puan + **beceri radar grafiği** (güçlü / zayıf alanlar) + önerilen başlangıç aşaması.
- Test istenince tekrarlanabilir; her aşama sonunda ayrıca bir "aşama atlama sınavı" vardır.

---

## 5. Müfredat (Aşama Aşama)

### Aşama 0 — Temeller
- Taşların hareketi (her taş için mini oyun: "atla tüm yıldızları topla")
- Şah, mat, pat; rok, geçerken alma, terfi
- Piyon savaşı mini oyunu
- Taşların değeri, "asılı taş" kavramı

### Aşama 1 — Başlangıç (0–800)
- **Temel matlar:** V+Ş, K+Ş, iki kale ile merdiven matı
- 1 hamlede mat (yüzlerce örnek, hız odaklı)
- Asılı taşı görme / taş kaybetmeme
- **Açılış prensipleri:** merkez, gelişim, rok, vezirle erken çıkmamak
- İlk tuzaklar: Çoban matı ve ona karşı savunma, Legal tuzağı

### Aşama 2 — Kulüp adayı (800–1200)
- **Taktik motifler:** çatal, açmaz, şiş, açarak saldırı, çifte saldırı, savunmayı kaldırma
- **Mat kalıpları:** arka sıra, boğmaca, Anastasia, Arap, Boden, Damiano… (2 hamlede matlar)
- **Piyon oyunsonu temelleri:** kare kuralı, opozisyon, kilit kareler
- **İlk repertuvar** (beyaz + siyah için birer sistem, ör. İtalyan / Londra; e4'e karşı …, d4'e karşı …)
- Fil+Şah ile çift fil matı tanıtımı

### Aşama 3 — Kulüp oyuncusu (1200–1600)
- Kombinasyonlar (3–4 hamle), aday hamle düşünme yöntemi (şah çekme, alma, tehdit)
- **Kale oyunsonları:** Lucena, Philidor, kesme tekniği
- Vezir vs piyon (7. sıra), uzak serbest piyon, piyon çoğunluğu
- **Strateji:** açık hat, ileri karakol, iyi/kötü fil, zayıf kare, yarı açık hat
- Repertuvarı derinleştirme + her hattın **tipik orta oyun planı**

### Aşama 4 — İleri (1600–2000)
- Ara hamleler, sessiz hamleler, savunma bulmacaları ("tek kurtaran hamle")
- **Piyon yapıları ve planlar:** izole vezir piyonu (IQP), Carlsbad, Maroczy, Stonewall, asılı piyonlar
- Profilaksi, kötü taşı iyileştirme
- Fil+At ile mat, Vancura, kale oyunsonlarında aktif kale
- Değişim kararları (hangi taşı değişmeli)

### Aşama 5 — Uzman (2000+)
- Uzun hesaplama, görselleştirme (kör satranç egzersizleri)
- Etüt (study) pozisyonları, karmaşık savunma
- Teorik oyunsonları: Vezir vs Kale, Kale+Fil vs Kale (Philidor pozisyonu), zıt renkli filler
- Repertuvar derinliği ve hazırlık mantığı

Her aşama **üniteye**, her ünite şu sıraya bölünür:
**Ders → Kılavuzlu örnek → Pratik → Yarım oyun (motora karşı) → Ünite sınavı.**

---

## 6. Egzersiz Türleri

| Tür | Açıklama | Kullanıcı ne yapar |
|---|---|---|
| **Etkileşimli ders** | Tahtada adım adım anlatım, oklar ve vurgular | Ara ara "şimdi sen oyna" hamleleri |
| **Bulmaca** | Tek doğru çözümlü pozisyon | Çözüm dizisini oynar; rakip cevapları otomatik |
| **Yarım oyun** | "Buradan kazan" / "Buradan berabere tut" | Motora karşı oynar, hamle limiti olabilir |
| **Açılış antrenörü** | Repertuvar hattını hamle hamle ezberletir, sapmalara cevap ister | Doğru hamle sırasını oynar; her hamlenin "neden"i gösterilir |
| **Ezber kartları (SRS)** | Teorik pozisyonlar, mat kalıpları, açılış hatları | Pozisyonu görür, doğru hamle(ler)i oynar |
| **Hız taktiği** | 3/5 dakikada mümkün olduğunca çok bulmaca | Örüntü tanıma hızını artırır |
| **Plan bul** | Stratejik pozisyonda en iyi plan hamlesi | Hamle yapar, motor toleransla değerlendirir |
| **Hamleyi tahmin et** | Klasik usta oyunlarında sıradaki hamle | Her hamlede tahmin yapar, puan alır |
| **Görselleştirme** | Taşlar gizlenir / hamleler sadece notasyonla verilir | Son pozisyonda soruyu tahtada cevaplar |
| **Tam oyun + analiz** | Motora (ayarlanabilir güç) karşı oyun | Oyun sonunda hataları ayrılır, bulmacaya çevrilir |

### Hata durumunda geri bildirim
- Yanlış hamlede: neden yanlış olduğu gösterilir (motorun **çürütme** hamlesi tahtada oynatılır).
- Kademeli ipucu: 1) hangi taş, 2) hangi tema, 3) çözüm. İpucu puan kazancını azaltır.

---

## 7. Verimi Artıracak Sistemler

1. **Günlük antrenman planı** (seçilebilir süre: 15 / 30 / 45 dk)
   - Isınma: 5 hızlı taktik
   - Tekrar: vadesi gelen SRS kartları + hata defteri
   - Yeni konu: mevcut ünitenin bir sonraki dersi
   - Uygulama: 1 yarım oyun veya kısa bir oyun
2. **Aralıklı tekrar (SM-2 / FSRS benzeri):** ezber gerektiren her şey için.
3. **Hata defteri:** yanlış çözülen pozisyonlar 1 gün, 3 gün, 7 gün sonra tekrar gelir.
4. **Zayıf alan önceliği:** günlük plan, puanı en düşük beceri alanına daha fazla pay ayırır.
5. **İlerleme paneli:** genel puan grafiği, beceri radarı, seri (streak), tamamlanan üniteler.
6. **Aşama atlama sınavı:** konuları bilen kullanıcı üniteleri atlayabilir.
7. **Kendi oyunlarından öğrenme:** PGN yapıştır (Lichess/Chess.com'dan) → motor analizi → hatalar
   kişisel bulmacaya dönüşür.
8. **Düşünme yöntemi kartı:** her pozisyonda kontrol listesi (Tehdit ne? Zorlayıcı hamleler? Zayıflıklar? Plan?).

---

## 8. İçerik Kaynakları

- **Bulmacalar:** Lichess bulmaca veritabanı (CC0). Bir Node script'i ile tema ve puana göre filtrelenip
  `src/data/puzzles/*.json` olarak küçük bir alt küme (ör. 5–10 bin) üretilir.
- **Açılış adları:** Lichess `chess-openings` (CC0) ECO listesi.
- **Repertuvar hatları, dersler, oyunsonu pozisyonları:** projede elle yazılır (FEN + açıklama + çözüm).
- **Usta oyunları:** telifsiz klasik oyunlar (Morphy, Capablanca, Fischer'in eski oyunları vb.) PGN olarak.

---

## 9. Mimari

```
src/
  app/            # yönlendirme, düzen, tema
  board/          # Tahta bileşeni, hamle girişi, ok/vurgu katmanı
  engine/         # Stockfish worker sarmalayıcı (analiz, en iyi hamle, rakip modu)
  core/
    rating.ts     # Glicko benzeri puanlama
    srs.ts        # aralıklı tekrar zamanlaması
    progress.ts   # kayıt / yükleme (localStorage)
    validate.ts   # bulmaca çözümü ve motor toleransı ile hamle kontrolü
  modules/
    placement/    # seviye testi
    lesson/       # etkileşimli ders oynatıcı
    puzzle/       # bulmaca oynatıcı + hız taktiği
    endgame/      # yarım oyun (motora karşı)
    opening/      # açılış antrenörü
    review/       # SRS + hata defteri
    play/         # tam oyun + analiz
    dashboard/    # ilerleme paneli, günlük plan
  data/
    curriculum/   # aşama/ünite tanımları (JSON/TS)
    lessons/      # ders içerikleri
    openings/     # repertuvar ağaçları
    endgames/     # oyunsonu pozisyonları
    puzzles/      # filtrelenmiş bulmacalar
scripts/
  build-puzzles.ts  # Lichess CSV → filtrelenmiş JSON
```

### Temel veri tipleri (taslak)

```ts
type Skill = 'tactics' | 'mates' | 'calculation' | 'endgame' | 'opening' | 'strategy';

interface Exercise {
  id: string;
  kind: 'puzzle' | 'halfgame' | 'opening-line' | 'plan' | 'lesson-step';
  fen: string;
  skills: Skill[];
  rating: number;
  solution?: string[];          // UCI hamleler (bulmaca)
  goal?: 'win' | 'draw' | 'mate-in';  // yarım oyun
  moveLimit?: number;
  tolerance?: number;           // plan bul: kabul edilen cp kaybı
  hints?: string[];
  explanation?: string;
}

interface UserProfile {
  ratings: Record<Skill, { r: number; rd: number }>;
  stage: number;
  completedUnits: string[];
  srs: Record<string, { due: number; interval: number; ease: number }>;
  mistakes: string[];
  streak: { current: number; lastDay: string };
}
```

---

## 10. Uygulama Adımları (Kilometre Taşları)

- [x] **M0 — İskelet:** Vite + React + TS kurulumu, tahta bileşeni, `chess.js` ile yasal hamle, temel düzen ve tema.
- [x] **M1 — Motor + Bulmaca oynatıcı:** Stockfish worker, bulmaca çözme akışı (rakip otomatik cevap),
      ipucu, yanlış hamlede çürütme gösterimi. Bulmaca veri script'i.
- [x] **M2 — Puanlama + Seviye testi:** rating sistemi, adaptif 12 pozisyonluk test, sonuç ekranı ve beceri radarı.
- [x] **M3 — Müfredat + Ders oynatıcı:** aşama/ünite yapısı, etkileşimli ders formatı, ilerleme kaydı.
      Aşama 0–1 içerikleri.
- [x] **M4 — Yarım oyun modülü:** motora karşı "kazan / berabere tut", hamle limiti, ayarlı motor gücü.
      Temel matlar ve piyon oyunsonları.
- [x] **M5 — Açılış antrenörü + SRS:** repertuvar ağacı, hat ezberi, sapmalar, tuzaklar; aralıklı tekrar motoru.
- [x] **M6 — Günlük plan + Panel + Hata defteri:** günlük antrenman akışı, ilerleme grafikleri, streak.
- [x] **M7 — İçerik genişletme:** Aşama 2–5 dersleri, oyunsonları, stratejik "plan bul" pozisyonları.
- [x] **M8 — Ek modüller:** hız taktiği, hamleyi tahmin et, görselleştirme, tam oyun + analiz, PGN içe aktarma.
- [x] **M9 — Cila:** sesler, animasyonlar, mobil uyum, PWA, aşama atlama sınavları.

---

## 11. Uygulama Notları (plandan sapmalar ve kararlar)

- **Seviye testindeki strateji sorusu:** Elle yazılan stratejik pozisyonlarda motor farkları çok küçük çıktı
  (≤ 30 cp), yani seviyeyi ayırt etmiyordu. Testte bunun yerine Lichess'in *sessiz hamle / savunma hamlesi*
  bulmacaları kullanılıyor. Elle yazılan "plan bul" pozisyonları derslerde, toleranslı motor değerlendirmesiyle
  ve tematik açıklamayla yer alıyor.
- **Yarım oyunlarda mat hedefi:** Tablebase'siz motor KBB/KBN gibi teorik kazançları düşük değerlendirdiği için
  "mat kaçtı" ölçütü değerlendirmeye değil **taş kaybına** bağlandı.
- **Repertuvar (varsayılan):** Beyaz İtalyan Oyunu + 1.e4 karşı cevapları (Alapin, Fransız/Caro-Kann ilerleme,
  İskandinav, Pirc); alternatif Londra Sistemi. Siyah 1.e4 e5 ve Vezir Gambiti Reddi. Ayrıca tuzaklar kursu.
- **Veri:** 11.454 Lichess bulmacası (beceri × puan × tema dengeli), 37 ünite, 12 teorik oyunsonu,
  31 açılış hattı, 6 klasik oyun.
- **Kalite kontrolleri:** `npm test` (234 test: tüm ders hamleleri, açılış hatları ve klasik oyunlar yasal mı,
  mat adımları gerçekten mat mı, her temada yeterli bulmaca var mı) ve `npm run verify` (Stockfish ile
  oyunsonu değerlendirmeleri, repertuvar hamleleri ve plan adımlarının doğruluğu).

## 12. Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # birim + içerik testleri
npm run verify     # Stockfish ile içerik doğrulaması
npm run build      # üretim derlemesi (PWA, çevrimdışı çalışır)
npm run puzzles    # bulmaca setini Lichess veritabanından yeniden üret (~300 MB indirir)
```

## 13. Sonraki Adımlar İçin Fikirler

- Daha fazla elle yazılmış ders pozisyonu ve "plan bul" örneği (özellikle Aşama 4–5)
- Vancura, kale+fil vs kale gibi ileri teorik oyunsonları
- Repertuvarı kişiselleştirme (kullanıcının kendi hattını eklemesi)
- Lichess/Chess.com hesabından oyunları otomatik çekme
