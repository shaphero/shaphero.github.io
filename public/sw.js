// Service Worker for daveshap.com - v1.0.0
// Implements cache-first strategy for static assets

const CACHE_NAME = 'daveshap-v1';
const RUNTIME_CACHE = 'daveshap-runtime';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/_assets/hoisted.*.js',
  '/_assets/hoisted.*.css',
  '/images/dave-rooftop.webp'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Don't cache all at once, just critical assets
        return cache.addAll([
          '/',
          '/index.html'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    // Special handling for Google Fonts
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(
        caches.match(request)
          .then(response => response || fetch(request).then(fetchResponse => {
            return caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          }))
      );
    }
    return;
  }

  // Network-first for HTML (always get fresh content)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache on network failure
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, images)
  if (
    url.pathname.includes('/_assets/') ||
    url.pathname.includes('/images/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) return response;

          return fetch(request).then(fetchResponse => {
            // Only cache successful responses
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse;
            }

            const responseClone = fetchResponse.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });

            return fetchResponse;
          });
        })
    );
    return;
  }

  // Default: Network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});