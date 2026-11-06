// Offline support. Pages network-first (updates show up), everything else
// cache-first. Vite's /assets/ files are content-hashed, so caching them
// forever is safe even though they sit outside this folder.
const CACHE = 'maths-arcade-v1';
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('maths-arcade') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => put(req, res)).catch(() => caches.match(req).then((hit) => hit || caches.match('./'))));
    return;
  }
  const scope = new URL('./', location).pathname;
  if (!url.pathname.startsWith(scope) && !url.pathname.startsWith('/assets/')) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => (res.ok ? put(req, res) : res))));
});
