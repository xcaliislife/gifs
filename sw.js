const CACHE_NAME = 'gif-conv-v2';

// Archivos propios (si alguno no existe, no rompe la instalación)
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Librerías externas que usa el index (para que funcione sin conexión)
const CDN = [
  'https://cdn.jsdelivr.net/npm/mp4-muxer@5/build/mp4-muxer.js',
  'https://cdn.jsdelivr.net/npm/webm-muxer@5/build/webm-muxer.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all([
      ...ASSETS.map(u => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})),
      ...CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => cache.put(u, r)).catch(() => {}))
    ]);
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Borra cachés de versiones anteriores
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
    await clients.claim();
  })());
});

// Red primero (siempre la versión más nueva), caché solo si no hay conexión.
// Ya no se inyectan COOP/COEP: el convertidor usa WebCodecs y no necesita SharedArrayBuffer.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  const sameOrigin = new URL(req.url).origin === self.location.origin;

  e.respondWith((async () => {
    try {
      // 'no-cache' evita que el caché HTTP de GitHub Pages (≈10 min) devuelva un index viejo
      const res = await fetch(req, sameOrigin ? { cache: 'no-cache' } : undefined);
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const cached = await caches.match(req, { ignoreSearch: true });
      return cached || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    }
  })());
});
