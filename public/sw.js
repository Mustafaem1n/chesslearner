// Çevrimdışı çalışma: uygulama kabuğu, bulmacalar ve motor önbelleğe alınır.
const CACHE = 'satranc-v1'
const PRECACHE = [
  './',
  './index.html',
  './data/puzzles.json',
  './stockfish/stockfish-18-lite-single.js',
  './stockfish/stockfish-18-lite-single.wasm',
  './favicon.svg',
  './icon-192.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // Sayfa: önce ağ (güncel sürüm), çevrimdışıysa önbellek
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')))
    return
  }
  // Diğer dosyalar: önbellekten ver, arka planda güncelle
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
        .catch(() => cached)
      return cached ?? network
    }),
  )
})
