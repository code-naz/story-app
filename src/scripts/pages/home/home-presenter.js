import ApiService from '../../data/api';
import IdbDatabase from '../../data/idb-db';

export default class HomePresenter {
  #view = null;
  #allStories = [];
  #searchQuery = '';
  #sortOrder = 'newest';
  #isOnlyFavorite = false;

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

  performLogout() {
    localStorage.clear();
    window.location.hash = '#/login';
  }

  async loadStoriesData() {
    try {
      // Ambil data dari API
      this.#allStories = await ApiService.getStories();
      await this.filterAndRender();
    } catch (error) {
      this.#view.showError(error.message);
    }
  }

  async filterAndRender() {
    let result = [...this.#allStories];
    const favorites = await IdbDatabase.getAllFavorites();
    const favoriteIds = favorites.map(f => f.id);

    // 1. Logika Filter Khusus Favorit (Skilled)
    if (this.#isOnlyFavorite) {
      result = result.filter(story => favoriteIds.includes(story.id));
    }

    // 2. Logika Search (Skilled)
    if (this.#searchQuery.trim() !== '') {
      const query = this.#searchQuery.toLowerCase();
      result = result.filter(story => 
        story.name.toLowerCase().includes(query) || 
        story.description.toLowerCase().includes(query)
      );
    }

    // 3. Logika Sorting (Skilled)
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return this.#sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    this.#view.renderStoriesList(result, favoriteIds);
  }

  handleSearch(query) {
    this.#searchQuery = query;
    this.filterAndRender();
  }

  handleSort(order) {
    this.#sortOrder = order;
    this.filterAndRender();
  }

  toggleFilterFavorite() {
    this.#isOnlyFavorite = !this.#isOnlyFavorite;
    this.#view.updateFilterButtonUI(this.#isOnlyFavorite);
    this.filterAndRender();
  }

  async toggleFavoriteStatus(story) {
    try {
      const isExist = await IdbDatabase.getFavoriteById(story.id);
      if (isExist) {
        // Jika sudah ada, hapus dari database lokal (Basic - Delete)
        await IdbDatabase.deleteFavorite(story.id);
      } else {
        // Jika belum ada, simpan ke database lokal (Basic - Create/Store)
        await IdbDatabase.addFavorite(story);
      }
      await this.filterAndRender(); // Re-render tampilan terupdate
    } catch (error) {
      this.#view.showError('Gagal mengubah status favorit lokal.');
    }
  }
}