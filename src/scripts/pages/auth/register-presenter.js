import ApiService from '../../data/api';

export default class RegisterPresenter {
  #view = null;

  constructor(view) {
    this.#view = view;
  }

  checkSession() {
    if (localStorage.getItem('USER_TOKEN')) {
      window.location.hash = '#/';
    }
  }

  async performRegister({ name, email, password }) {
    this.#view.showLoading();
    try {
      const response = await ApiService.register({ name, email, password });
      this.#view.showSuccess(response.message);
      window.location.hash = '#/login';
    } catch (error) {
      this.#view.showError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}