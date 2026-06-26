import ApiService from '../../data/api';
import IdbDatabase from '../../data/idb-db'; // Import Database Pembantu

export default class AddStoryPresenter {
  #view = null;
  #imageBlob = null;
  #lat = null;
  #lon = null;
  #stream = null;

  constructor(view) {
    this.#view = view;
  }

  checkSession() {
    if (!localStorage.getItem('USER_TOKEN')) {
        window.location.hash = '#/login';
        return false; 
    }
    return true; 
  }

  async startCamera() {
    try {
      this.#stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      this.#view.setVideoStream(this.#stream);
    } catch {
      this.#view.hideCameraUI();
    }
  }

  initGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.#view.updateMapView(latitude, longitude);
          this.setCoordinates(latitude, longitude, 'Sensor GPS');
        },
        () => {
          this.#view.showLocationError();
        }
      );
    }
  }

  setCoordinates(lat, lon, sourceText) {
    this.#lat = lat;
    this.#lon = lon;
    this.#view.updateMarkerAndStatus(lat, lon, sourceText);
  }

  capturePhoto(video, canvas) {
    if (!this.#stream) return;
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      this.#imageBlob = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      this.#view.showPreviewPhoto(URL.createObjectURL(blob));
    }, 'image/jpeg');
  }

  handleFilePicker(file) {
    if (file) {
      this.#imageBlob = file;
      this.#view.showPreviewPhoto(URL.createObjectURL(file));
    }
  }

  closeCameraStream() {
    if (this.#stream) {
      this.#stream.getTracks().forEach(track => track.stop());
      this.#stream = null;
    }
  }

  // --- LOGIKA UTAMA SINKRONISASI & DRAFT OFFLINE (Kriteria 4 - Advance) ---
  async submitStory(description) {
    if (!this.#imageBlob) {
      this.#view.showError('Wajib melampirkan foto!');
      return;
    }

    this.#view.showLoading();

    // Skenario A: Perangkat Sedang Offline
    if (!navigator.onLine) {
      await this.#saveToOfflineDraft(description);
      return;
    }

    // Skenario B: Perangkat Online (Kirim Langsung)
    try {
      await ApiService.addStory({
        description,
        photo: this.#imageBlob,
        lat: this.#lat,
        lon: this.#lon,
      });

      this.#view.showSuccess();
      this.closeCameraStream();
      window.location.hash = '#/';
    } catch (error) {
      // Skenario Cadangan: Gagal di tengah jalan karena drop koneksi mendadak
      console.warn('Gagal kirim, mengamankan data ke draft offline...', error);
      await this.#saveToOfflineDraft(description);
    } finally {
      this.#view.hideLoading();
    }
  }

  async #saveToOfflineDraft(description) {
    try {
      // Karena File/Blob tidak bisa disimpan mentah-mentah ke beberapa versi IDB,
      // kita konversi file foto menjadi format Base64 Text agar aman disimpan secara offline.
      const base64Photo = await this.#convertFileToBase64(this.#imageBlob);

      const draftStory = {
        description,
        photo: base64Photo,
        lat: this.#lat,
        lon: this.#lon,
        createdAt: new Date().toISOString()
      };

      // Simpan ke antrean IndexedDB (Kriteria 4 Advance - Offline Save)
      await IdbDatabase.addDraft(draftStory);

      alert('ℹ️ Perangkatmu Offline! Cerita disimpan aman sebagai draft lokal dan akan otomatis terkirim begitu kamu kembali online.');
      
      this.closeCameraStream();
      window.location.hash = '#/';
    } catch (idbError) {
      this.#view.showError(`Gagal mengamankan draft offline: ${idbError.message}`);
    }
  }

  #convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}