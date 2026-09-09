const CACHE_NAME = 'arr-dashboard-v2';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/static/offline.html',
  '/static/favicon.png',
  '/static/icons/icon-192x192.png',
  '/static/icons/icon-512x512.png',
  '/static/icons/icon-maskable-192x192.png',
  '/static/icons/icon-maskable-512x512.png',
  '/static/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Use Promise.allSettled or cache individually so one 401/303 redirect doesn't fail entire install
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { credentials: 'same-origin' })
              .then((res) => {
                if (res.ok) {
                  return cache.put(url, res);
                }
              })
              .catch(() => {})
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('arr-dashboard-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Exclude API requests and auth actions from caching
  if (url.pathname.startsWith('/api/') || url.pathname === '/logout') {
    return;
  }

  // HTML navigation: Network-First strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          const offlinePage = await caches.match('/static/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // Static assets (CSS, JS, images, fonts): Cache-First / Stale-While-Revalidate
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/static/') || url.pathname === '/manifest.webmanifest')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // External fonts and CDNs (Google Fonts, Tailwind CDN)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.tailwindcss.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        }).catch(() => cached);
      })
    );
  }
});
