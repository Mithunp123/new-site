import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('gradix_token') || null,
  user: JSON.parse(localStorage.getItem('gradix_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('gradix_token'),

  login: (token, user) => {
    localStorage.setItem('gradix_token', token);
    localStorage.setItem('gradix_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('gradix_token');
    localStorage.removeItem('gradix_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const updated = { ...JSON.parse(localStorage.getItem('gradix_user') || '{}'), ...userData };
    localStorage.setItem('gradix_user', JSON.stringify(updated));
    set({ user: updated });
  }
}));

export default useAuthStore;
