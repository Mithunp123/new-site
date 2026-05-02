import { create } from 'zustand';
import * as creatorApi from '../api/creatorApi.js';
import * as brandApi from '../api/brandApi.js';
import * as adminApi from '../api/adminApi.js';

const safeParse = (val) => {
  if (!val || val === 'undefined') return null;
  try { return JSON.parse(val); } catch { return null; }
};

const useAuthStore = create((set) => ({
  token: localStorage.getItem('gradix_token') || null,
  user: safeParse(localStorage.getItem('gradix_user')),
  role: localStorage.getItem('gradix_role') || null,
  isAuthenticated: !!localStorage.getItem('gradix_token'),
  loading: false,
  error: null,

  // Creator Register
  registerCreator: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await creatorApi.register(data);
      const { token, creator } = res.data.data;
      localStorage.setItem('gradix_token', token);
      localStorage.setItem('gradix_user', JSON.stringify(creator));
      localStorage.setItem('gradix_role', 'creator');
      set({
        token,
        user: creator,
        role: 'creator',
        isAuthenticated: true,
        loading: false
      });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // Creator Login
  loginCreator: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await creatorApi.login(data);
      const { token, creator } = res.data.data;
      localStorage.setItem('gradix_token', token);
      localStorage.setItem('gradix_user', JSON.stringify(creator));
      localStorage.setItem('gradix_role', 'creator');
      set({
        token,
        user: creator,
        role: 'creator',
        isAuthenticated: true,
        loading: false
      });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // Brand Register
  registerBrand: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await brandApi.brandRegister(data);
      const { token, brand } = res.data.data;
      localStorage.setItem('gradix_token', token);
      localStorage.setItem('gradix_user', JSON.stringify(brand));
      localStorage.setItem('gradix_role', 'brand');
      set({
        token,
        user: brand,
        role: 'brand',
        isAuthenticated: true,
        loading: false
      });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // Brand Login
  loginBrand: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await brandApi.brandLogin(data);
      const { token, brand } = res.data.data;
      localStorage.setItem('gradix_token', token);
      localStorage.setItem('gradix_user', JSON.stringify(brand));
      localStorage.setItem('gradix_role', 'brand');
      set({
        token,
        user: brand,
        role: 'brand',
        isAuthenticated: true,
        loading: false
      });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // Unified Login (Async)
  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await creatorApi.unifiedLogin(data);
      const { token, user, role } = res.data.data;
      localStorage.setItem('gradix_token', token);
      localStorage.setItem('gradix_user', JSON.stringify(user));
      localStorage.setItem('gradix_role', role);
      set({
        token,
        user,
        role,
        isAuthenticated: true,
        loading: false
      });
      return { user, role };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // Admin Login (Legacy specific)
  loginAdmin: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await adminApi.adminLogin(data);
      const { token, admin } = res.data.data;
      localStorage.setItem('gradix_token', token);
      localStorage.setItem('gradix_user', JSON.stringify(admin));
      localStorage.setItem('gradix_role', 'admin');
      set({
        token,
        user: admin,
        role: 'admin',
        isAuthenticated: true,
        loading: false
      });
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('gradix_token');
    localStorage.removeItem('gradix_user');
    localStorage.removeItem('gradix_role');
    set({ token: null, user: null, role: null, isAuthenticated: false });
  },

  // Session Initializer (Sync)
  setSession: (token, user) => {
    localStorage.setItem('gradix_token', token);
    localStorage.setItem('gradix_user', JSON.stringify(user));
    localStorage.setItem('gradix_role', user?.role || 'creator');
    set({ token, user, role: user?.role || 'creator', isAuthenticated: true });
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  updateUser: (userData) => {
    const updated = { ...JSON.parse(localStorage.getItem('gradix_user') || '{}'), ...userData };
    localStorage.setItem('gradix_user', JSON.stringify(updated));
    set({ user: updated });
  }
}));

export default useAuthStore;
