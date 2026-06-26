const CACHE_NAME = 'story-app-static-v3';
const DYNAMIC_CACHE_NAME = 'story-app-dynamic-v3';

// Daftar Aset Statis relatif agar aman dari eror 404 Redundant di GitHub Pages
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'favicon.png',
  'manifest.json'
];

// 1. Event Install: Mengunci aset statis dasar aplikasi ke dalam cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Event Activate: Membersihkan cache versi lama yang sudah usang
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log('🧹 Menghapus cache usang:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Event Fetch: Interseptor Jaringan & Strategi Caching
self.addEventListener('fetch', (event) => {
  // Perbaikan Utama: Tolak semua metode non-GET (seperti POST saat kirim cerita / subscribe)
  // karena Cache Storage browser bawaan hanya mendukung caching data bermetode GET!
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // --- STRATEGI A: KHUSUS DATA DINAMIS API STORIES (Network First) ---
  if (requestUrl.href.includes('story-api.dicoding.dev/v1/stories')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // --- STRATEGI B: KHUSUS ASET STATIS APP SHELL (Stale-While-Revalidate) ---
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => console.log('Aplikasi berjalan dalam mode offline.'));
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// ==========================================================================
// LISTENERS PUSH NOTIFICATION (Kriteria 2 Advance)
// ==========================================================================

self.addEventListener('push', (event) => {
  console.log('Sinyal Push Notification diterima dari server...');

  let data;
  try {
    data = event.data ? event.data.json() : { title: 'Story App', body: 'Ada kabar baru untukmu!' };
  } catch (e) {
    data = { title: 'Story App', body: event.data ? event.data.text() : 'Ada kabar baru untukmu!' };
  }

  const options = {
    body: data.body,
    icon: 'images/logo.png',
    badge: 'favicon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './#/'
    },
    actions: [
      {
        action: 'view-action',
        title: 'Lihat Cerita 📖',
        icon: 'favicon.png'
      },
      {
        action: 'close-action',
        title: 'Tutup ❌'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Cerita Baru!', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  notification.close();

  if (action === 'close-action') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const targetUrl = notification.data.url;

      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});