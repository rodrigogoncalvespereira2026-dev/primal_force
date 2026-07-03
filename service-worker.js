const CACHE_NAME = 'primal-force-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/core/game.js',
  './js/core/animationsystem.js',
  './js/core/toonshader.js',
  './js/core/modelloader.js',
  './js/core/currency3d.js',
  './js/core/currencyicons.js',
  './js/core/progression.js',
  './js/core/primordial.js',
  './js/core/account.js',
  './js/core/dialog.js',
  './js/core/gacha.js',
  './js/core/battlepass.js',
  './js/entities/model3d.js',
  './js/entities/ranger.js',
  './js/entities/enemy.js',
  './js/entities/pickup.js',
  './js/scenes/menu.js',
  './js/scenes/select.js',
  './js/scenes/game.js',
  './js/scenes/shop.js',
  './js/scenes/creator.js',
  './js/scenes/mapmaker.js',
  './js/scenes/worldmap.js',
  './js/scenes/trophies.js',
  './js/scenes/account.js',
  './manifest.json',
  './icon-192.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
