import ApiService from '../../data/api';

export default class LoginPresenter {
  #view = null;

  constructor(view) {
    this.#view = view;
  }

  checkSession() {
    if (localStorage.getItem('USER_TOKEN')) {
      window.location.hash = '#/';
    }
  }

  async performLogin({ email, password }) {
    this.#view.showLoading();
    try {
      const response = await ApiService.login({ email, password });
      
      localStorage.setItem('USER_TOKEN', response.loginResult.token);
      localStorage.setItem('USER_NAME', response.loginResult.name);

      this.#view.showSuccess(response.loginResult.name);
      window.location.hash = '#/';
    } catch (error) {
      this.#view.showError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}