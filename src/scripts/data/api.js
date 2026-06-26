import CONFIG from '../config';

class ApiService {
  // 1. Registrasi Akun Baru
  static async register({ name, email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  // 2. Login Akun
  static async login({ email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  // 3. Mengambil Daftar Cerita
  static async getStories() {
    const token = localStorage.getItem('USER_TOKEN');
    if (!token) {
      throw new Error('Token tidak ditemukan, silakan login kembali.');
    }

    const response = await fetch(`${CONFIG.BASE_URL}/stories?location=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson.listStory;
  }

  // 4. Menambahkan Cerita Baru (Multipart/FormData)
  static async addStory({ description, photo, lat, lon }) {
    const token = localStorage.getItem('USER_TOKEN');
    if (!token) {
      throw new Error('Token tidak ditemukan, silakan login kembali.');
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    
    if (lat !== null && lon !== null) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  // 5. Mengirim Data Push Subscription (Kriteria 2 - Push Notification)
  static async sendPushSubscription(subscription) {
    const token = localStorage.getItem('USER_TOKEN');
    
    // Perbaikan: Konversi subscription ke objek biasa dan buang properti expirationTime
    // karena backend Dicoding me-reject request jika ada expirationTime (Eror 400)
    const subscriptionJson = subscription.toJSON();
    const cleanSubscription = {
      endpoint: subscriptionJson.endpoint,
      keys: subscriptionJson.keys,
    };
    
    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(cleanSubscription),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }
}

export default ApiService;