import { create } from 'zustand';
import * as creatorApi from '../api/creatorApi.js';
import * as brandApi from '../api/brandApi.js';
import * as adminApi from '../api/adminApi.js';
import api from '../api/axios.js';
import { queryClient } from '../queryClient.js';

const safeParse = (val) => {
  if (!val || val === 'undefined') return null;
  try { return JSON.parse(val); } catch { return null; }
};

// ── Session storage helpers ─────────────────────────────────────────────────
const SESSION_KEYS = ['gradix_token', 'gradix_user', 'gradix_role', 'gradix_session_id'];

const writeSession = (token, user, role) => {
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem('gradix_token', token);
  localStorage.setItem('gradix_user', JSON.stringify(user));
  localStorage.setItem('gradix_role', role);
  localStorage.setItem('gradix_session_id', sessionId);
  localStorage.setItem('gradix_login_at', new Date().toISOString());
  return sessionId;
};

const clearSession = () => {
  SESSION_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('gradix_login_at');
};

// ── Cross-tab broadcast ─────────────────────────────────────────────────────
const bc = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('gradix_auth')
  : null;

const useAuthStore = create((set, get) => ({
  token:           localStorage.getItem('gradix_token') || null,
  user:            safeParse(localStorage.getItem('gradix_user')),
  role:            localStorage.getItem('gradix_role') || null,
  sessionId:       localStorage.getItem('gradix_session_id') || null,
  loginAt:         localStorage.getItem('gradix_login_at') || null,
  isAuthenticated: !!localStorage.getItem('gradix_token'),
  initialized:     false,   // true once token has been verified (or no token exists)
  loading:         false,
  error:           null,

  // ── Creator Register ──────────────────────────────────────────────────────
  registerCreator: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await creatorApi.register(data);
      const { token, creator } = res.data.data;
      const sessionId = writeSession(token, creator, 'creator');
      queryClient.clear();
      set({ token, user: creator, role: 'creator', sessionId, isAuthenticated: true, loading: false });
      bc?.postMessage({ type: 'LOGIN', role: 'creator' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Registration failed', loading: false });
      throw err;
    }
  },

  // ── Creator Login ─────────────────────────────────────────────────────────
  loginCreator: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await creatorApi.login(data);
      const { token, creator } = res.data.data;
      const sessionId = writeSession(token, creator, 'creator');
      queryClient.clear(); // Clear any previous user's cached data
      set({ token, user: creator, role: 'creator', sessionId, isAuthenticated: true, loading: false });
      bc?.postMessage({ type: 'LOGIN', role: 'creator' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed', loading: false });
      throw err;
    }
  },

  // ── Brand Register ────────────────────────────────────────────────────────
  registerBrand: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await brandApi.brandRegister(data);
      const { token, brand } = res.data.data;
      const sessionId = writeSession(token, brand, 'brand');
      queryClient.clear();
      set({ token, user: brand, role: 'brand', sessionId, isAuthenticated: true, loading: false });
      bc?.postMessage({ type: 'LOGIN', role: 'brand' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Registration failed', loading: false });
      throw err;
    }
  },

  // ── Brand Login ───────────────────────────────────────────────────────────
  loginBrand: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await brandApi.brandLogin(data);
      const { token, brand } = res.data.data;
      const sessionId = writeSession(token, brand, 'brand');
      queryClient.clear();
      set({ token, user: brand, role: 'brand', sessionId, isAuthenticated: true, loading: false });
      bc?.postMessage({ type: 'LOGIN', role: 'brand' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed', loading: false });
      throw err;
    }
  },

  // ── Unified Login ─────────────────────────────────────────────────────────
  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await creatorApi.unifiedLogin(data);
      const { token, user, role } = res.data.data;
      const sessionId = writeSession(token, user, role);
      queryClient.clear();
      set({ token, user, role, sessionId, isAuthenticated: true, loading: false });
      bc?.postMessage({ type: 'LOGIN', role });
      return { user, role };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed', loading: false });
      throw err;
    }
  },

  // ── Google Login ──────────────────────────────────────────────────────────
  googleLogin: async (accessToken) => {
    set({ loading: true, error: null });
    try {
      const res = await creatorApi.googleLogin({ access_token: accessToken });
      const { token, user, role } = res.data.data;
      const sessionId = writeSession(token, user, role);
      queryClient.clear();
      set({ token, user, role, sessionId, isAuthenticated: true, loading: false });
      bc?.postMessage({ type: 'LOGIN', role });
      return { user, role };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Google Login failed', loading: false });
      throw err;
    }
  },

  // ── Admin Login ───────────────────────────────────────────────────────────
  loginAdmin: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await adminApi.adminLogin(data);
      const { token, admin } = res.data.data;
      const sessionId = writeSession(token, admin, 'admin');
      queryClient.clear();
      set({ token, user: admin, role: 'admin', sessionId, isAuthenticated: true, loading: false });
      bc?.postMessage({ type: 'LOGIN', role: 'admin' });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed', loading: false });
      throw err;
    }
  },

  // ── Session Logout (server-side token revocation) ─────────────────────────
  logout: async () => {
    const token = get().token;
    // Tell server to revoke this token
    if (token) {
      try {
        await api.post('/api/auth/logout');
      } catch {
        // Proceed with local logout even if server call fails
      }
    }
    queryClient.clear(); // Clear React Query cache
    clearSession();
    set({ token: null, user: null, role: null, sessionId: null, loginAt: null, isAuthenticated: false });
    // Broadcast logout to all other tabs
    bc?.postMessage({ type: 'LOGOUT' });
  },

  // ── Instant local logout (no server call — for 401 responses) ────────────
  forceLogout: () => {
    queryClient.clear(); // Clear React Query cache
    clearSession();
    set({ token: null, user: null, role: null, sessionId: null, loginAt: null, isAuthenticated: false });
    bc?.postMessage({ type: 'LOGOUT' });
  },

  // ── Session Initializer ───────────────────────────────────────────────────
  setSession: (token, user) => {
    const role = user?.role || 'creator';
    const sessionId = writeSession(token, user, role);
    set({ token, user, role, sessionId, isAuthenticated: true });
  },

  setError:    (error) => set({ error }),
  clearError:  () => set({ error: null }),

  updateUser: (userData) => {
    const current = safeParse(localStorage.getItem('gradix_user')) || {};
    const updated = { ...current, ...userData };
    localStorage.setItem('gradix_user', JSON.stringify(updated));
    set({ user: updated });
  },

  // ── Token verification on app startup ────────────────────────────────────
  // Hits the server to confirm the stored token is still valid.
  // Only clears the session on a definitive 401 (token rejected by server).
  // Network errors / 5xx are treated as "assume valid" so a slow server
  // doesn't log the user out unexpectedly.
  initializeAuth: async () => {
    const token = localStorage.getItem('gradix_token');
    const role   = localStorage.getItem('gradix_role');

    if (!token) {
      set({ initialized: true });
      return;
    }

    // 5-second timeout — if server doesn't respond, keep the session and move on
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const opts = { signal: controller.signal };
      if (role === 'admin' || role === 'super_admin' || role === 'moderator') {
        await api.get('/api/admin/profile', opts);
      } else if (role === 'brand') {
        await api.get('/api/brand/profile', opts);
      } else {
        await api.get('/api/creator/profile', opts);
      }
      // Token confirmed valid
      set({ initialized: true });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // Server explicitly rejected the token — clear session
        clearSession();
        set({
          token: null, user: null, role: null,
          sessionId: null, loginAt: null,
          isAuthenticated: false,
          initialized: true,
        });
      } else {
        // Network error, timeout, 5xx — keep existing session, let the app load
        set({ initialized: true });
      }
    } finally {
      clearTimeout(timer);
    }
  },
}));

// ── Cross-tab listener ──────────────────────────────────────────────────────
if (bc) {
  bc.onmessage = (event) => {
    if (event.data?.type === 'LOGOUT') {
      clearSession();
      useAuthStore.setState({
        token: null, user: null, role: null,
        sessionId: null, loginAt: null, isAuthenticated: false,
      });
      // Redirect to login if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
  };
}

export default useAuthStore;
