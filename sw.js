const CACHE_NAME = 'the-empty-sanctuary-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/app.js',
  '/public/manifest.json',
  '/public/home.html',
  '/public/command.html',
  '/public/archive-grid.html',
  '/public/past-reflections.html',
  '/public/memory-crystal.html',
  '/public/icons/icon-192x192.png',
  '/public/icons/icon-512x512.png',
  'https://sql.js.org/dist/sql-wasm.wasm',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});