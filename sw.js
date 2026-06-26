const CACHE_NAME = 'story-app-static-v1';
const DYNAMIC_CACHE_NAME = 'story-app-dynamic-v1';

// Daftar Aset Statis (App Shell)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json'
];

// 1. Event Install: Mengunci aset statis dasar aplikasi ke dalam cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
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
});

// 3. Event Fetch: Interseptor Jaringan & Strategi Caching
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // --- STRATEGI A: KHUSUS DATA DINAMIS API STORIES (Kriteria 3 Advance - Network First) ---
  if (requestUrl.href.includes('story-api.dicoding.dev/v1/stories')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Jika internet nyala, ambil data terbaru dan update isi cache dinamis
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Jika internet MATI (Offline), otomatis selamatkan dengan data terakhir di cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // --- STRATEGI B: KHUSUS ASET STATIS APP SHELL (Stale-While-Revalidate) ---
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Ambil dari cache biar instan, tapi tetep fetch di background buat update cache terbaru
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => console.log('Aplikasi berjalan dalam mode offline untuk aset statis.'));
        
        return cachedResponse;
      }
      // Jika belum ada di cache, langsung tembak ke jaringan
      return fetch(event.request);
    })
  );
});

// ==========================================================================
// BAGIAN BARU: LISTENERS PUSH NOTIFICATION (Kriteria 2 Advance)
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
    icon: 'favicon.png',
    badge: 'favicon.png',
    vibrate: [200, 100, 200], // Fitur Getaran Kustom (Advance)
    data: {
      url: data.url || './#/' // Membawa data URL arah navigasi halaman
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