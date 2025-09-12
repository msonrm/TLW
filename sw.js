const CACHE_NAME = 'tlw-bookmark-v7';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache failed:', error);
      })
  );
});

// フェッチ時にキャッシュから返す
self.addEventListener('fetch', (event) => {
  // Share Target処理
  const url = new URL(event.request.url);
  
  // 共有データを受信した場合の処理
  if (event.request.method === 'GET' && url.searchParams.has('url')) {
    console.log('Share target data received:', {
      url: url.searchParams.get('url'),
      title: url.searchParams.get('title'),
      text: url.searchParams.get('text')
    });
    
    // 通常のフェッチ処理に流す（パラメータ付きでindex.htmlを返す）
    event.respondWith(
      caches.match('./index.html')
        .then((response) => {
          if (response) {
            console.log('Serving index.html for share target');
            return response;
          }
          return fetch('./index.html');
        })
    );
    return;
  }
  
  // 通常のフェッチ処理
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュがあればそれを返す、なければネットワークから取得
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request);
      }
    )
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating... v2');
  // 即座に制御を開始
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 即座にクライアントを制御
      self.clients.claim()
    ])
  );
});
