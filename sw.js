const VERSION = 'cineticket-v2.3.0';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './favicon_io/android-chrome-192x192.png', './favicon_io/android-chrome-512x512.png',
  './favicon_io/apple-touch-icon.png', './favicon_io/favicon-32x32.png',
  './favicon_io/favicon-16x16.png', './favicon_io/favicon.ico'];
const NO_CACHE = ['itunes.apple.com', 'api.themoviedb.org', 'wikipedia.org'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NO_CACHE.some(h => url.hostname.endsWith(h))) return; // APIs de búsqueda: siempre red

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
