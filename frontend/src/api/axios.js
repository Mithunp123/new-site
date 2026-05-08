import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach token ───────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gradix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: handle 401 (expired / revoked token) ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session locally without calling server (token already invalid)
      ['gradix_token', 'gradix_user', 'gradix_role', 'gradix_session_id', 'gradix_login_at']
        .forEach(k => localStorage.removeItem(k));

      // Lazy-import store to avoid circular dependency
      import('../store/authStore.js').then(({ default: useAuthStore }) => {
        useAuthStore.getState().forceLogout();
      });

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
