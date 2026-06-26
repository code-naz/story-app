import RegisterPresenter from './register-presenter';

export default class RegisterPage {
  #presenter = null;

  async render() {
    return `
      <section class="container auth-container" style="max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background: #fff;">
        <h1><i class="fa-solid fa-user-plus"></i> Daftar Akun</h1>
        <form id="register-form">
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="name" style="display: block; margin-bottom: 5px; font-weight: bold;">Nama Lengkap</label>
            <input type="text" id="name" style="width: 100%; padding: 8px; box-sizing: border-box;" required>
          </div>
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="email" style="display: block; margin-bottom: 5px; font-weight: bold;">Email</label>
            <input type="email" id="email" style="width: 100%; padding: 8px; box-sizing: border-box;" required>
          </div>
          <div class="form-group" style="margin-bottom: 20px;">
            <label for="password" style="display: block; margin-bottom: 5px; font-weight: bold;">Password</label>
            <input type="password" id="password" minlength="8" style="width: 100%; padding: 8px; box-sizing: border-box;" required>
          </div>
          <button type="submit" id="btn-register-submit" style="width: 100%; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Daftar
          </button>
        </form>
        <p style="margin-top: 15px; text-align: center;">Sudah punya akun? <a href="#/login">Login di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter(this);
    this.#presenter.checkSession();

    const form = document.querySelector('#register-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.querySelector('#name').value;
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;

      this.#presenter.performRegister({ name, email, password });
    });
  }

  showLoading() {
    const btn = document.querySelector('#btn-register-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mendaftarkan...';
  }

  hideLoading() {
    const btn = document.querySelector('#btn-register-submit');
    btn.disabled = false;
    btn.innerHTML = 'Daftar';
  }

  showError(message) {
    alert(`❌ Registrasi Gagal: ${message}`);
  }

  showSuccess(message) {
    alert(`🎉 ${message || 'Registrasi berhasil! Silakan login.'}`);
  }
}