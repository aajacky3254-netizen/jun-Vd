// 💡 更新版本號，強制瀏覽器清除舊的 Cache First 快取
const CACHE_NAME = 'ibus-cache-v3'; 

const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './driver_portal.html',
  './dispatch.html',
  './schedule.html',
  './auth.js',
  './firebase-init.js',
  './output.css', 
  './manifest.json',
  './images/logo.png' // 🚀 完美轉為本地快取，斷網也能秒讀 LOGO
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // 強制立即接管
});

self.addEventListener('activate', event => {
  // 清除舊版多餘的快取
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 🚀 核心修改：採用 Network First (網路優先) 策略
self.addEventListener('fetch', event => {
  // 忽略非 http/https 的請求 (例如擴充功能的 chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  // 對於 Firestore API 的請求，讓 Firebase SDK 自行處理其離線機制，不要攔截
  if (event.request.url.includes('firestore.googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // 如果網路請求成功，將最新的結果更新到快取中
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 只有當網路斷線、請求失敗時，才從快取中尋找備用資源
        console.log('[Service Worker] 網路斷線，啟動離線快取備援:', event.request.url);
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse; // 如果快取裡也沒有，就會自然報錯，或者您可以建立一個專屬的 offline.html
        });
      })
  );
});