const CACHE_NAME = 'gif-conv-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación y cacheo
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Fuerza al SW a activarse sin esperar
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Toma el control de las pestañas abiertas inmediatamente
});

// Interceptar peticiones para habilitar COOP y COEP
self.addEventListener('fetch', (event) => {
  // Evitar errores con extensiones de navegador y peticiones chrome-extension
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 0) return response; // Para peticiones opacas

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
