const CACHE_NAME = 'the-empty-sanctuary-cache-v3';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './js/app.js',
  './js/data/database.js',
  './js/domain/models.js',
  './js/ui/renderer.js',
  './js/ui/archive-controller.js',
  './js/ui/past-reflections-controller.js',
  './js/ui/pet-canvas-controller.js',
  './public/manifest.json',
  './public/home.html',
  './public/command.html',
  './public/archive-grid.html',
  './public/past-reflections.html',
  './public/memory-crystal.html',
  './public/sprites/fox_1.png',
  './public/sprites/fox_1_spritesheet.png.png',
  './public/sprites/fox_2.png',
  './public/sprites/fox_2_spritesheet.png',
  './public/sprites/fox_3.png',
  './public/sprites/fox_3_spritesheet.png.png',
  './public/sprites/hats_grid.png',
  './public/icons/icon-192x192.png',
  './public/icons/icon-512x512.png',
  'https://sql.js.org/dist/sql-wasm.wasm',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols_Outlined:wght,FILL@100..700,0..1&display=swap'
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