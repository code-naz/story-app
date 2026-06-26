import HomePresenter from './home-presenter';
import NotificationHelper from '../../utils/notification-helper';
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

export default class HomePage {
  #presenter = null;
  #map = null;
  #mapMarkers = [];

  async render() {
    return `
      <section class="container" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
          <h1>Cerita Terbaru</h1>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button id="enable-notification-btn" style="padding: 10px 15px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; display: none;"></button>
            
            <a href="#/add-story" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;"><i class="fa-solid fa-plus"></i> Tambah Cerita</a>
            <button id="logout-btn" style="padding: 10px 15px; background-color: #dc3545; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;"><i class="fa-solid fa-power-off"></i> Logout</button>
          </div>
        </div>

        <div id="map" style="height: 350px; width: 100%; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ccc; z-index: 1;"></div>

        <div style="background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px; display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 200px;">
            <label for="search-input" style="display:none;">Cari cerita</label>
            <input type="text" id="search-input" placeholder="🔍 Cari nama atau cerita..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
          <div>
            <label for="sort-select" style="display:none;">Urutkan</label>
            <select id="sort-select" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #fff;">
              <option value="newest">Terbaru 📅</option>
              <option value="oldest">Terlama ⏳</option>
            </select>
          </div>
          <div>
            <button id="filter-fav-btn" style="padding: 10px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
              <i class="fa-solid fa-star"></i> Semua Cerita
            </button>
          </div>
        </div>

        <main id="story-list">
          <p style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Sedang memuat cerita...</p>
        </main>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter(this);
    if (!this.#presenter.checkSession()) return;

    // Hubungkan tombol notifikasi ke helper UI (Revisi K2)
    const notifyBtn = document.querySelector('#enable-notification-btn');
    if (notifyBtn) {
      NotificationHelper.initButton(notifyBtn);
    }

    this.#initMap();
    await this.#presenter.loadStoriesData();

    document.querySelector('#search-input').addEventListener('input', (e) => {
      this.#presenter.handleSearch(e.target.value);
    });

    document.querySelector('#sort-select').addEventListener('change', (e) => {
      this.#presenter.handleSort(e.target.value);
    });

    document.querySelector('#filter-fav-btn').addEventListener('click', () => {
      this.#presenter.toggleFilterFavorite();
    });

    document.querySelector('#logout-btn').addEventListener('click', () => {
      this.#presenter.performLogout();
    });
  }

  #initMap() {
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri'
    });

    this.#map = L.map('map', {
      center: [-2.548926, 118.014863],
      zoom: 5,
      layers: [osmLayer]
    });

    L.control.layers({ "Peta Standar": osmLayer, "Satelit": satelliteLayer }).addTo(this.#map);
  }

  renderStoriesList(stories, favoriteIds) {
    const container = document.querySelector('#story-list');
    container.innerHTML = '';

    this.#mapMarkers.forEach(marker => this.#map.removeLayer(marker));
    this.#mapMarkers = [];

    if (stories.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Tidak ada cerita yang cocok dengan pencarian.</p>';
      return;
    }

    stories.forEach((story) => {
      const isFav = favoriteIds.includes(story.id);

      if (story.lat !== null && story.lon !== null) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.#map);
        marker.bindPopup(`
          <div style="max-width: 150px;">
            <strong>${story.name}</strong>
            <img src="${story.photoUrl}" alt="Foto ${story.name}" style="width:100%; height:70px; object-fit:cover; border-radius:4px; margin-block:5px;">
            <p style="margin:0; font-size:11px;">${story.description.substring(0, 30)}...</p>
          </div>
        `);
        this.#mapMarkers.push(marker);
      }

      const card = document.createElement('article');
      card.style.cssText = 'border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fff; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.05);';
      card.innerHTML = `
        <img src="${story.photoUrl}" alt="Foto oleh ${story.name}" style="width: 100%; height: 200px; object-fit: cover;">
        
        <button class="fav-toggle-btn" data-id="${story.id}" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; color: ${isFav ? '#ffc107' : '#ccc'}; transition: color 0.2s;">
          <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
        </button>

        <div style="padding: 15px;">
          <h2 style="font-size: 1.15rem; margin-bottom: 8px;">${story.name}</h2>
          <p style="color: #555; font-size: 0.9rem; line-height: 1.4; margin-bottom: 12px;">${story.description}</p>
          <small style="color: #999;"><i class="fa-regular fa-calendar"></i> ${new Date(story.createdAt).toLocaleDateString('id-ID')}</small>
        </div>
      `;

      card.querySelector('.fav-toggle-btn').addEventListener('click', () => {
        this.#presenter.toggleFavoriteStatus(story);
      });

      container.appendChild(card);
    });
  }

  updateFilterButtonUI(isFilterActive) {
    const btn = document.querySelector('#filter-fav-btn');
    if (isFilterActive) {
      btn.style.backgroundColor = '#ffc107';
      btn.style.color = '#333';
      btn.innerHTML = '<i class="fa-solid fa-star"></i> Hanya Favorit ⭐';
    } else {
      btn.style.backgroundColor = '#6c757d';
      btn.style.color = 'white';
      btn.innerHTML = '<i class="fa-solid fa-star"></i> Semua Cerita';
    }
  }

  showError(msg) {
    alert(`❌ Eror: ${msg}`);
  }
}