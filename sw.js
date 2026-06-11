const CACHE_NAME = 'ibus-cache-v2'; // 💡 升級版本號強制更新
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './personal.html',
  './query.html',
  './dispatch.html',
  './schedule.html',
  './auth.js',
  './firebase-init.js',
  './output.css', // 💡 修正：加入 CSS 緩存
  './manifest.json',
  'https://raw.githubusercontent.com/aajacky3254-netizen/jun-Vd/main/%E8%B1%90%E6%9D%B1%E5%AE%A2%E9%81%8B%20LOGO.png' // 緩存 LOGO
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // 強制立即接管
});

self.addEventListener('activate', event => {
  // 💡 修正：清除舊版多餘的快取
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 💡 修正：採用 Cache First, fall back to Network 策略
      return response || fetch(event.request);
    }).catch(() => {
      // 如果都失敗且請求的是 HTML，可以選擇回傳 offline 頁面（若有做的話）
      console.log('網路斷線，無法拉取新資料');
    })
  );
});
