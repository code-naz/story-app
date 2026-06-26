import ApiService from '../data/api';

class NotificationHelper {
  static async initButton(buttonElement) {
    if (!('Notification' in window) || !('PushManager' in window)) {
      buttonElement.style.display = 'none';
      return;
    }

    // 🚀 AMANKAN KASUS LAMA: Jika dari awal status sudah diizinkan, langsung daftarkan ke backend otomatis
    if (Notification.permission === 'granted') {
      this.#subscribeNotification();
    }

    this._updateButtonUI(buttonElement);

    buttonElement.addEventListener('click', async () => {
      buttonElement.disabled = true;
      buttonElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
      
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.#subscribeNotification();
        } else if (permission === 'denied') {
          alert('🔕 Izin notifikasi ditolak. Jika berubah pikiran, silakan aktifkan manual lewat pengaturan gembok/ikon setelan di browser.');
        }
      } catch (error) {
        console.error('Gagal memproses perizinan notifikasi:', error);
      } finally {
        this._updateButtonUI(buttonElement);
      }
    });
  }

  static _updateButtonUI(buttonElement) {
    buttonElement.style.display = 'inline-block';

    if (Notification.permission === 'granted') {
      buttonElement.disabled = true;
      buttonElement.style.backgroundColor = '#28a745';
      buttonElement.style.color = '#fff';
      buttonElement.innerHTML = '<i class="fa-solid fa-bell"></i> Notifikasi Aktif';
    } else if (Notification.permission === 'denied') {
      buttonElement.disabled = true;
      buttonElement.style.backgroundColor = '#6c757d';
      buttonElement.style.color = '#fff';
      buttonElement.innerHTML = '<i class="fa-solid fa-bell-slash"></i> Notifikasi Diblokir';
    } else {
      buttonElement.disabled = false;
      buttonElement.style.backgroundColor = '#ffc107';
      buttonElement.style.color = '#333';
      buttonElement.innerHTML = '<i class="fa-solid fa-bell"></i> Aktifkan Notifikasi';
    }
  }

  static async #subscribeNotification() {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const vapidPublicKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
        const convertedKey = this.#urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Kirim token registrasi subscription ke server backend Dicoding
      await ApiService.sendPushSubscription(subscription);
      console.log('✅ Perangkat sukses terdaftar di server Dicoding!');
    } catch (error) {
      console.error('Gagal mengirim registrasi push ke backend:', error);
    }
  }

  static #urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default NotificationHelper;