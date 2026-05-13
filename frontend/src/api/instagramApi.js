import api from './axios';

export const getInstagramProfile = () => api.get('/instagram/profile');
export const getInstagramReels = () => api.get('/instagram/reels');
export const getReelInsights = (mediaId) => api.get(`/instagram/reel-insights/${mediaId}`);
export const saveCurrentInstagramConnection = () => api.post('/instagram/save-current');
export const disconnectInstagram = () => api.post('/instagram/disconnect');

export const getInstagramConnectUrl = (returnTo = '/register') => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const url = new URL('/auth/facebook', baseURL);
  url.searchParams.set('return_to', returnTo);

  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed.state && parsed.state.token) {
        url.searchParams.set('token', parsed.state.token);
      }
    }
  } catch (err) {
    console.error('Failed to parse token from localStorage');
  }

  return url.toString();
};
