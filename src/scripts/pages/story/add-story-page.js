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
  #selectedLocation = { lat: null, lon: null };

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

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="file-picker" style="display: block; font-weight: bold; margin-bottom: 8px;">Unggah Foto / Jepret Kamera</label>
            <input type="file" id="file-picker" accept="image/*" required style="margin-bottom: 15px; display: block;">
          </div>

          <div class="form-group" style="margin-bottom: 25px;">
            <label style="display: block; font-weight: bold; margin-bottom: 8px;">Pilih Lokasi Cerita (Klik pada Peta)</label>
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
    this.#initMap();

    const form = document.querySelector('#add-story-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.#handleSubmit();
    });
  }

  #initMap() {
    this.#map = L.map('map-add').setView([-2.548926, 118.014863], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.#map);

    this.#map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.#selectedLocation.lat = lat;
      this.#selectedLocation.lon = lng;

      if (this.#marker) {
        this.#marker.setLatLng(e.latlng);
      } else {
        this.#marker = L.marker(e.latlng).addTo(this.#map);
      }

      document.querySelector('#location-status').innerHTML = `📍 Lokasi ditentukan (Klik Peta): ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    });
  }

  async #handleSubmit() {
    const description = document.querySelector('#description-input').value;
    const filePicker = document.querySelector('#file-picker');
    const photo = filePicker.files[0];
    const submitBtn = document.querySelector('#submit-btn');

    if (!photo) {
      alert('Harap pilih atau unggah foto terlebih dahulu!');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    try {
      await this.#presenter.addStory({
        description,
        photo,
        lat: this.#selectedLocation.lat,
        lon: this.#selectedLocation.lon
      });
    } catch (error) {
      alert(`Gagal menambahkan cerita: ${error.message}`);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Cerita';
    }
  }

  showSuccess(message) {
    alert(message);
    window.location.hash = '#/';
  }

  showError(message) {
    alert(`❌ Eror: ${message}`);
  }
}