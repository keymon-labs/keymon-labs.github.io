const CACHE_NAME = 'pianofun-428aed74';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/egg-style.css',
  './js/noteHelpers.js',
  './js/audio.js',
  './js/midi.js',
  './js/keyboard.js',
  './js/songs.js',
  './js/renderer.js',
  './js/game.js',
  './js/eggBirds.js',
  './js/eggSprites.js',
  './js/eggAudio.js',
  './js/eggRenderer.js',
  './js/eggGame.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install — cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache-first for same-origin static assets
  if (url.origin === location.origin) {
    const isStatic = STATIC_ASSETS.some(
      (asset) => url.pathname.endsWith(asset.replace('./', '/')) || url.pathname === '/'
    );

    if (isStatic) {
      event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
      );
      return;
    }
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.origin === location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
