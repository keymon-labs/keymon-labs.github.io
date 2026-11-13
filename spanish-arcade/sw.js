// Offline support. Pages network-first (updates show up), everything else
// cache-first. Vite's /assets/ files are content-hashed, so caching them
// forever is safe even though they sit outside this folder.
// Vite's hashed bundles sit next to the app folders: /assets/ or /<repo>/assets/ on a fork.
const ASSETS = new URL('../assets/', location).pathname;
const CACHE = 'spanish-arcade-v5';
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

// Also cache the page's hashed /assets/ files, so the very first visit already works offline.
// Best effort (the install still succeeds, the files are then cached on first use), but a failure is logged.
// addAll rejects duplicate requests (the HTML links an icon twice), so the list is de-duplicated.
async function precacheAssets(c) {
  try {
    const html = await (await fetch('./', { cache: 'reload' })).text();
    const urls = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((m) => new URL(m[1], location).href);
    await c.addAll([...new Set(urls)]);
  } catch (err) { console.warn('spanish-arcade sw: precache of /assets/ failed', err); }
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).then(() => precacheAssets(c))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('spanish-arcade') && k !== CACHE).map((k) => caches.delete(k))))
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
  // The clip manifest keeps its name when clips change: network-first. The clips themselves (audio/<hash>.mp3) are cache-first
  // like everything else, filled on first play (never precached: the install stays small).
  if (url.pathname.endsWith('/audio/manifest.json')) {
    e.respondWith(fetch(req).then((res) => (res.ok ? put(req, res) : res)).catch(() => caches.match(req).then((hit) => hit || Response.error())));
    return;
  }
  const scope = new URL('./', location).pathname;
  if (!url.pathname.startsWith(scope) && !url.pathname.startsWith(ASSETS)) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => (res.ok ? put(req, res) : res))));
});
