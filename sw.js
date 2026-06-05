/* ════════════════════════════════════════
   SERVICE WORKER — Ms. Tra Vocab App
   Strategy: Cache-first for assets, 
             Network-first for JSON data
════════════════════════════════════════ */

const CACHE_NAME = 'mstra-vocab-v1';
const DATA_CACHE = 'mstra-data-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Data files to cache
const DATA_FILES = [
  './data/cambridge-ielts-reading-16.json',
  './data/oxford3000.json',
  './data/oxford5000.json',
];

// ── INSTALL ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // JSON data: network-first, fallback to cache
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(DATA_CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Audio files: cache-first
  if (url.pathname.includes('/audio/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: cache-first with network fallback
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});

// ── BACKGROUND SYNC (future use) ──────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-progress') {
    // Future: sync progress to server
  }
});
