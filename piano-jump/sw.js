// Offline support: pages network-first (so updates show up), other files cache-first.
const CACHE = "piano-jump-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("piano-jump") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const put = (req, res) => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameScope = url.origin === location.origin && url.pathname.startsWith(new URL("./", location).pathname);
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => put(req, res)).catch(() => caches.match(req).then(h => h || caches.match("./index.html"))));
    return;
  }
  if (!sameScope && !/googleapis\.com|gstatic\.com/.test(url.hostname)) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => (res.ok || res.type === "opaque") ? put(req, res) : res)));
});
