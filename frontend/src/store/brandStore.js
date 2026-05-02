import { create } from 'zustand';
import * as brandApi from '../api/brandApi.js';

export const useBrandStore = create((set) => ({
  brand: null,
  loading: false,
  error: null,

  // Auth
  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await brandApi.brandRegister(data);
      localStorage.setItem('gradix_token', res.data.token);
      localStorage.setItem('gradix_role', 'brand');
      localStorage.setItem('gradix_user', JSON.stringify(res.data.user));
      set({ brand: res.data.user, loading: false });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await brandApi.brandLogin(data);
      localStorage.setItem('gradix_token', res.data.token);
      localStorage.setItem('gradix_role', 'brand');
      localStorage.setItem('gradix_user', JSON.stringify(res.data.user));
      set({ brand: res.data.user, loading: false });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('gradix_token');
    localStorage.removeItem('gradix_role');
    localStorage.removeItem('gradix_user');
    set({ brand: null });
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null })
}));
