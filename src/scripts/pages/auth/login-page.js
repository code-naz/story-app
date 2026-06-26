import LoginPresenter from './login-presenter';

export default class LoginPage {
  #presenter = null;

  async render() {
    return `
      <section class="container auth-container" style="max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background: #fff;">
        <h1><i class="fa-solid fa-right-to-bracket"></i> Login</h1>
        <form id="login-form">
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="email" style="display: block; margin-bottom: 5px; font-weight: bold;">Email</label>
            <input type="email" id="email" style="width: 100%; padding: 8px; box-sizing: border-box;" required>
          </div>
          <div class="form-group" style="margin-bottom: 20px;">
            <label for="password" style="display: block; margin-bottom: 5px; font-weight: bold;">Password</label>
            <input type="password" id="password" style="width: 100%; padding: 8px; box-sizing: border-box;" required>
          </div>
          <button type="submit" id="btn-login-submit" style="width: 100%; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Masuk
          </button>
        </form>
        <p style="margin-top: 15px; text-align: center;">Belum punya akun? <a href="#/register">Daftar di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter(this);
    this.#presenter.checkSession();

    const form = document.querySelector('#login-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;

      this.#presenter.performLogin({ email, password });
    });
  }

  showLoading() {
    const btn = document.querySelector('#btn-login-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  }

  hideLoading() {
    const btn = document.querySelector('#btn-login-submit');
    btn.disabled = false;
    btn.innerHTML = 'Masuk';
  }

  showError(message) {
    alert(`❌ Login Gagal: ${message}`);
  }

  showSuccess(name) {
    alert(`👋 Selamat datang kembali, ${name}!`);
  }
}