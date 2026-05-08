import api from './axios';

// Auth
export const login = (data) => api.post('/api/auth/creator/login', data);
export const register = (data) => api.post('/api/auth/creator/register', data);
export const unifiedLogin = (data) => api.post('/api/auth/login', data);
export const loginUser = login; // Alias for compatibility
export const registerUser = register; // Alias for compatibility
export const googleLogin = (data) => api.post('/api/auth/google-login', data);

// Creator
export const getProfile = () => api.get('/api/creator/profile');
export const updateProfile = (data) => api.patch('/api/creator/profile', data);
export const updateProfilePhoto = (data) => api.patch('/api/creator/profile/photo', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updatePassword = (data) => api.patch('/api/creator/password', data);
export const deleteAccount = () => api.delete('/api/creator/account');

// Dashboard
export const getDashboard = () => api.get('/api/creator/dashboard');

// Requests
export const getRequests = (params) => api.get('/api/creator/requests', { params });
export const acceptCampaign = (id) => api.put(`/api/campaign/${id}/accept`);
export const declineCampaign = (id) => api.put(`/api/campaign/${id}/decline`);
export const negotiateCampaign = (id, data) => api.put(`/api/campaign/${id}/negotiate`, data);

// Campaigns
export const getMyCampaigns = (params) => api.get('/api/creator/campaigns', { params });
export const uploadContent = (id, data) => api.post(`/api/creator/campaigns/${id}/upload-content`, data);

// Earnings
export const getEarnings = () => api.get('/api/creator/earnings');
export const withdrawEarnings = (data) => api.post('/api/creator/earnings/withdraw', data);

// Analytics
export const getAnalytics = (params) => api.get('/api/creator/analytics', { params });

// Leads
export const getLeads = () => api.get('/api/creator/leads');

// Notifications
export const getNotifications = () => api.get('/api/creator/notifications');
export const markNotificationRead = (id) => api.patch(`/api/creator/notifications/${id}/read`);

// Social Profiles
export const getSocialProfiles = () => api.get('/api/creator/social-profiles');
export const upsertSocialProfile = (data) => api.post('/api/creator/social-profiles', data);
