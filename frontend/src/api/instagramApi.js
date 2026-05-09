import api from './axios';

export const getInstagramProfile = () => api.get('/instagram/profile');
export const getInstagramMedia = () => api.get('/instagram/media');
export const saveCurrentInstagramConnection = () => api.post('/instagram/save-current');
export const disconnectInstagram = () => api.post('/instagram/disconnect');

export const getInstagramConnectUrl = (returnTo = '/register') => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const url = new URL('/auth/facebook', baseURL);
  url.searchParams.set('return_to', returnTo);
  return url.toString();
};
