const CACHE_NAME = 'gif-conv-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
``
// Instalación y cacheo
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

// Interceptar peticiones para habilitar COOP y COEP (Necesario para MP4/FFmpeg)
self.addEventListener('fetch', (event) => {
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonamos la respuesta para añadir los headers de seguridad
        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })
      .catch(() => caches.match(event.request))
  );
});
