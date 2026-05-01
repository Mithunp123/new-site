import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' }
});

// Auth header interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gradix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gradix_token');
      localStorage.removeItem('gradix_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
