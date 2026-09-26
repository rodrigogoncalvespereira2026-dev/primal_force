const CACHE_NAME = 'primal-force-v4';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json',
  './icon-192.svg',
  './grimorio.html',
  './viewer.html',

  './js/main.js',
  './js/core/account.js',
  './js/core/animationsystem.js',
  './js/core/audio.js',
  './js/core/currency3d.js',
  './js/core/currencyicons.js',
  './js/core/engine3d.js',
  './js/core/input.js',
  './js/core/joystick.js',
  './js/core/modelloader.js',
  './js/core/primordial.js',
  './js/core/progression.js',
  './js/core/renderer.js',
  './js/core/story.js',
  './js/core/toonshader.js',
  './js/core/utils.js',
  './js/core/wave.js',
  './js/core/world.js',
  './js/core/world3d.js',
  './js/data/rangerparts.js',
  './js/entities/boss.js',
  './js/entities/enemy.js',
  './js/entities/model3d.js',
  './js/entities/particle.js',
  './js/entities/pickup.js',
  './js/entities/projectile.js',
  './js/entities/ranger.js',
  './js/mapeditor/data.js',
  './js/mapeditor/editor.js',
  './js/mapeditor/storage.js',
  './js/scenes/account.js',
  './js/scenes/battlepass.js',
  './js/scenes/creator.js',
  './js/scenes/dialog.js',
  './js/scenes/game.js',
  './js/scenes/mapmaker.js',
  './js/scenes/menu.js',
  './js/scenes/missions.js',
  './js/scenes/perfil.js',
  './js/scenes/primordial.js',
  './js/scenes/select.js',
  './js/scenes/shop.js',
  './js/scenes/trophies.js',
  './js/scenes/worldmap.js',
  './js/ui/hud.js',

  './vendor/three.min.js',
  './vendor/GLTFLoader.js',
  './vendor/OrbitControls.js',
  './models/sample.glb',

  './assets/img/gota/gota-comum.png',
  './assets/img/gota/gota-raro.png',
  './assets/img/gota/gota-super_raro.png',
  './assets/img/gota/gota-epico.png',
  './assets/img/gota/gota-lendario.png',
  './assets/img/gota/gota-mitico.png',
  './assets/img/gota/gota-primal.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(ASSETS.map(url => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
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
  const req = e.request;
  if (req.method !== 'GET') return;

  const sameOrigin = new URL(req.url).origin === self.location.origin;

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        fetch(req).then(res => {
          if (res && res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res.clone())).catch(() => {});
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque') && sameOrigin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate' && sameOrigin) {
          return caches.match('./index.html');
        }
        return Response.error();
      });
    })
  );
});
