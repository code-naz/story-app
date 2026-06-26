const DB_NAME = 'story-app-db';
const DB_VERSION = 1;

class IdbDatabase {
  static #openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Store 1: Untuk fitur Favorit (Basic & Skilled)
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
        // Store 2: Untuk antrean Sinkronisasi Offline (Advance)
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // --- CRUD UNTUK FAVORIT ---
  static async getAllFavorites() {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('favorites', 'readonly');
      const store = transaction.objectStore('favorites');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getFavoriteById(id) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('favorites', 'readonly');
      const store = transaction.objectStore('favorites');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async addFavorite(story) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('favorites', 'readwrite');
      const store = transaction.objectStore('favorites');
      const request = store.put(story);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteFavorite(id) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('favorites', 'readwrite');
      const store = transaction.objectStore('favorites');
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // --- CRUD UNTUK DRAFT OFFLINE ---
  static async addDraft(draftData) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.add(draftData);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllDrafts() {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteDraft(id) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

export default IdbDatabase;