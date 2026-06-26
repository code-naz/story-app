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