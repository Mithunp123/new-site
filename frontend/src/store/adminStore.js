import { create } from 'zustand';
import * as adminApi from '../api/adminApi.js';

export const useAdminStore = create((set) => ({
  admin: null,
  loading: false,
  error: null,

  // Auth
  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await adminApi.adminLogin(data);
      localStorage.setItem('gradix_token', res.data.token);
      localStorage.setItem('gradix_role', 'admin');
      localStorage.setItem('gradix_user', JSON.stringify(res.data.user));
      set({ admin: res.data.user, loading: false });
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
    set({ admin: null });
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null })
}));
