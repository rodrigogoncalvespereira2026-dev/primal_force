const CACHE_NAME = "primalforce-v1";
const ASSETS = [
    "/",
    "/index.html",
    "/config.js",
    "/primalforce-robots.js",
    "/robot-base.js",
    "/rex-ai.js",
    "/spike-ai.js",
    "/tri-ai.js",
    "/pluma-ai.js",
    "/nuck-ai.js",
    "/bolha-ai.js",
    "/anka-ai.js",
    "/crista-ai.js",
    "/blitz-ai.js",
    "/testa-ai.js",
    "/mare-ai.js",
    "/garra-ai.js",
    "/brisa-ai.js",
    "/vela-ai.js",
    "/fin-ai.js",
    "/ninho-ai.js",
    "/sol-ai.js",
    "/frill-ai.js",
    "/abismo-ai.js",
    "/alado-ai.js",
    "/assets/img/rex.png",
    "/assets/img/spike.png",
    "/assets/img/tri.png",
    "/assets/img/pluma.png",
    "/assets/img/nuck.png",
    "/assets/img/bolha.png",
    "/assets/img/anka.png",
    "/assets/img/crista.png",
    "/assets/img/blitz.png",
    "/assets/img/testa.png",
    "/assets/img/mare.png",
    "/assets/img/garra.png",
    "/assets/img/brisa.png",
    "/assets/img/vela.png",
    "/assets/img/fin.png",
    "/assets/img/ninho.png",
    "/assets/img/sol.png",
    "/assets/img/frill.png",
    "/assets/img/abismo.png",
    "/assets/img/alado.png",
    "/assets/models/rex.glb",
    "/assets/models/spike.glb",
    "/assets/models/tri.glb",
    "/assets/models/pluma.glb"
];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    if (e.request.method !== "GET") return;
    e.respondWith(
        fetch(e.request).then(r => {
            const clone = r.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            return r;
        }).catch(() => caches.match(e.request))
    );
});
