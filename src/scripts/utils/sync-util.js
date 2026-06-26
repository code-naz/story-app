import IdbDatabase from '../data/idb-db';
import ApiService from '../data/api';

class SyncUtil {
  static init() {
    // 1. Listener saat browser mendeteksi koneksi berubah jadi Online
    window.addEventListener('online', () => {
      console.log('🌐 Koneksi pulih kembali! Memulai proses sinkronisasi otomatis...');
      this.syncPendingStories();
    });

    // 2. Jalankan pengecekan sekali di awal saat aplikasi pertama kali dimuat
    if (navigator.onLine) {
      this.syncPendingStories();
    }
  }

  static async syncPendingStories() {
    try {
      const drafts = await IdbDatabase.getAllDrafts();
      if (drafts.length === 0) return;

      console.log(`📦 Ditemukan ${drafts.length} draft cerita tertunda. Memulai pengiriman...`);

      for (const draft of drafts) {
        // Kembalikan teks Base64 menjadi objek File/Blob gambar asli
        const photoFile = this.#base64ToFile(draft.photo, 'offline-upload.jpg');

        // Kirim data ke API server
        await ApiService.addStory({
          description: draft.description,
          photo: photoFile,
          lat: draft.lat,
          lon: draft.lon
        });

        // Hapus dari antrean IndexedDB jika kirim sukses (Kriteria 4 Advance - Clean Queue)
        await IdbDatabase.deleteDraft(draft.id);
        console.log(`✅ Draft ID ${draft.id} sukses tersinkronisasi ke server.`);
      }

      alert('🚀 Keren! Draft cerita yang kamu buat saat offline tadi sudah berhasil tersinkronisasi otomatis ke server!');
      
      // Refresh halaman jika user sedang berada di homepage agar cerita barunya kelihatan
      if (window.location.hash === '#/') {
        window.location.reload();
      }

    } catch (error) {
      console.error('❌ Proses sinkronisasi tertunda karena masalah koneksi/token:', error);
    }
  }

  // Fungsi Pembantu konversi Base64 ke File Object
  static #base64ToFile(base64String, filename) {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }
}

export default SyncUtil;