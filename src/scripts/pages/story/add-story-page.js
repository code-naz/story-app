import AddStoryPresenter from './add-story-presenter';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default class AddStoryPage {
  #presenter = null;
  #map = null;
  #marker = null;

  async render() {
    return `
      <section class="container" style="padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="margin-bottom: 25px;">
          <h1><i class="fa-solid fa-camera"></i> Bagikan Cerita Baru</h1>
        </div>

        <form id="add-story-form">
          <div class="form-group" style="margin-bottom: 20px;">
            <label for="description-input" style="display: block; font-weight: bold; margin-bottom: 8px;">Deskripsi Cerita</label>
            <textarea id="description-input" rows="5" required placeholder="Tulis ceritamu di sini..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;" class="form-control"></textarea>
          </div>

          <div class="form-group" id="camera-container" style="margin-bottom: 20px;">
            <span style="display: block; font-weight: bold; margin-bottom: 8px;">Ambil Foto secara Live</span>
            <video id="video-preview" autoplay playsinline style="width: 100%; max-height: 250px; background: #000; border-radius: 8px; margin-bottom: 10px;"></video>
            <button type="button" id="capture-btn" style="width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-bottom: 15px;">
              <i class="fa-solid fa-circle-dot"></i> Tangkap Foto Kamera
            </button>
            <canvas id="canvas-preview" style="display: none;"></canvas>
          </div>

          <div style="margin-bottom: 20px; text-align: center;">
            <img id="image-preview" src="" alt="Pratinjau Foto Cerita" style="max-width: 100%; max-height: 250px; border-radius: 8px; display: none; border: 1px solid #ddd; padding: 5px;">
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="file-picker" style="display: block; font-weight: bold; margin-bottom: 8px;">Atau Unggah via File Picker</label>
            <input type="file" id="file-picker" accept="image/*" style="margin-bottom: 15px; display: block;">
          </div>

          <div class="form-group" style="margin-bottom: 25px;">
            <span style="display: block; font-weight: bold; margin-bottom: 8px;">Pilih Lokasi Cerita (Klik pada Peta / Otomatis GPS)</span>
            <div id="map-add" style="height: 300px; width: 100%; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 10px; z-index: 1;"></div>
            <p id="location-status" style="color: #28a745; font-weight: bold; font-size: 0.9rem; margin-top: 5px;"></p>
          </div>

          <div style="display: flex; gap: 10px;">
            <button type="submit" id="submit-btn" style="padding: 12px 20px; background-color: #28a745; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; flex: 1;"><i class="fa-solid fa-paper-plane"></i> Kirim Cerita</button>
            <a href="#/" style="padding: 12px 20px; background-color: #6c757d; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; text-align: center;" id="cancel-btn">Batal</a>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new AddStoryPresenter(this);
    if (!this.#presenter.checkSession()) return;

    this.#initMap();
    
    // Memicu pop-up izin kamera dan lokasi dari Presenter asli saat halaman dimuat
    await this.#presenter.startCamera();
    this.#presenter.initGeolocation();

    const form = document.querySelector('#add-story-form');
    const captureBtn = document.querySelector('#capture-btn');
    const filePicker = document.querySelector('#file-picker');

    captureBtn.addEventListener('click', () => {
      const video = document.querySelector('#video-preview');
      const canvas = document.querySelector('#canvas-preview');
      this.#presenter.capturePhoto(video, canvas);
    });

    filePicker.addEventListener('change', (e) => {
      this.#presenter.handleFilePicker(e.target.files[0]);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = document.querySelector('#description-input').value;
      await this.#presenter.submitStory(description);
    });
  }

  #initMap() {
    this.#map = L.map('map-add').setView([-2.548926, 118.014863], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.#map);

    this.#map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.#presenter.setCoordinates(lat, lng, 'Pilihan Manual di Peta');
    });
  }

  // =========================================================================
  // LOGIKA UTAMA: MENYEDIAKAN METHOD ANTARMUKA (VIEW) YANG DICARI PRESENTER
  // =========================================================================

  setVideoStream(stream) {
    const video = document.querySelector('#video-preview');
    if (video) {
      video.srcObject = stream;
    }
  }

  hideCameraUI() {
    const cameraContainer = document.querySelector('#camera-container');
    if (cameraContainer) {
      cameraContainer.style.display = 'none';
    }
  }

  updateMapView(lat, lon) {
    if (this.#map) {
      this.#map.setView([lat, lon], 13);
    }
  }

  updateMarkerAndStatus(lat, lon, sourceText) {
    if (this.#map) {
      if (this.#marker) {
        this.#marker.setLatLng([lat, lon]);
      } else {
        this.#marker = L.marker([lat, lon]).addTo(this.#map);
      }
    }

    const statusText = document.querySelector('#location-status');
    if (statusText) {
      statusText.style.color = '#28a745';
      statusText.innerHTML = `📍 Lokasi ditentukan (${sourceText}): ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  }

  showPreviewPhoto(url) {
    const imgPreview = document.querySelector('#image-preview');
    if (imgPreview) {
      imgPreview.src = url;
      imgPreview.style.display = 'inline-block';
    }
  }

  showLocationError() {
    const statusText = document.querySelector('#location-status');
    if (statusText) {
      statusText.style.color = '#dc3545';
      statusText.innerHTML = '⚠️ Gagal melacak GPS otomatis. Silakan tentukan lokasi dengan cara mengklik manual pada area peta di atas.';
    }
  }

  showLoading() {
    const submitBtn = document.querySelector('#submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
    }
  }

  hideLoading() {
    const submitBtn = document.querySelector('#submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Cerita';
    }
  }

  showSuccess() {
    alert('🎉 Cerita berhasil dibagikan!');
  }

  showError(message) {
    alert(`❌ Eror: ${message}`);
  }
}