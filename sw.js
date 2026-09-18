// SINA App - Service Worker for Offline PWA Capabilities
const CACHE_NAME = 'sina-app-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'entry.html',
  'records.html',
  'profile.html',
  'login.html',
  'manifest.json',
  'css/base.css',
  'css/components.css',
  'css/entry.css',
  'js/config.js',
  'js/icons.js',
  'js/db.js',
  'js/auth.js',
  'js/pwa.js',
  'js/nav.js',
  'js/entry.js',
  'js/records.js',
  'js/dashboard.js',
  'assets/icon-192.svg',
  'assets/icon-512.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Ignore non-GET and chrome-extension requests
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('chrome-extension://')) return;
  if (e.request.url.includes('supabase.co')) {
    // Network first for Supabase calls
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Stale-while-revalidate for local app shell assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
