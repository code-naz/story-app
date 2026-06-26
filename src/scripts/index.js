import '../styles/styles.css';
import App from './pages/app';
import SyncUtil from './utils/sync-util';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  SyncUtil.init();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(() => {
          console.log('Service Worker terdaftar.');
        })
        .catch((err) => console.error('Service Worker gagal:', err));
    });
  }
});