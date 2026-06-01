const CACHE_NAME = 'ibus-cache-v1';
const urlsToCache = [
  './personal.html',
  './query.html',
  './auth.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 網路有通就抓最新，沒通就用快取
      return response || fetch(event.request);
    })
  );
});
