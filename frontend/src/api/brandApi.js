import api from './axios';

// Auth
export const brandRegister = (data) => api.post('/api/auth/brand/register', data);
export const brandLogin = (data) => api.post('/api/auth/brand/login', data);

// Profile & Settings
export const getBrandProfile = () => api.get('/api/brand/profile');
export const updateBrandProfile = (data) => api.patch('/api/brand/profile', data);
export const setBrandDetails = updateBrandProfile; // Alias for compatibility
export const updateBrandLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return api.post('/api/brand/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const updateBrandPassword = (data) => api.patch('/api/brand/password', data);
export const upsertBrandPreferences = (data) => api.post('/api/brand/preferences', data);
export const upsertBrandVerification = (data) => api.post('/api/brand/verification', data);

// Dashboard
export const getBrandDashboard = () => api.get('/api/brand/dashboard');

// Discovery
export const discoverCreators = (params) => api.get('/api/brand/discover', { params });
export const getCreatorProfile = (creatorId) => api.get(`/api/brand/creator/${creatorId}`);
export const saveCreator = (creatorId) => api.post(`/api/brand/creator/${creatorId}/save`);
export const unsaveCreator = (creatorId) => api.delete(`/api/brand/creator/${creatorId}/save`);
export const getSavedCreators = () => api.get('/api/brand/saved-creators');

// Collaborations & Campaigns
export const sendCollaborationRequest = (data) => api.post('/api/brand/collaboration/send-request', data);
export const getCollaborationRequests = () => api.get('/api/brand/collaboration/requests');
export const getCampaignTracking = () => api.get('/api/brand/campaigns/tracking');

// Legacy/Compatibility
export const getBrandCampaigns = (params) => api.get('/api/brand/campaigns', { params });
export const getCampaignDetail = (campaignId) => api.get(`/api/brand/campaign/${campaignId}`);
export const approveCampaignContent = (campaignId) => api.put(`/api/brand/campaign/${campaignId}/approve-content`);
export const rejectCampaignContent = (campaignId, data) => api.put(`/api/brand/campaign/${campaignId}/reject-content`, data);
export const raiseCampaignDispute = (campaignId, data) => api.post(`/api/brand/campaign/${campaignId}/dispute`, data);
export const markCampaignLive = (campaignId) => api.put(`/api/brand/campaign/${campaignId}/mark-live`);
export const releasePayment = (campaignId) => api.put(`/api/brand/campaign/${campaignId}/release-payment`);

// Analytics
export const getBrandRoiAnalytics = (params) => api.get('/api/brand/roi-analytics', { params });
export const getBrandLeadManagement = () => api.get('/api/brand/lead-management');
export const getBrandPayments = () => api.get('/api/brand/payments');
export const fundEscrow = (data) => api.post('/api/brand/payments/fund-escrow', data);

// Notifications
export const getBrandNotifications = () => api.get('/api/brand/notifications');
export const markBrandNotificationRead = (id) => api.patch(`/api/brand/notifications/${id}/read`);

// Go Live & Metrics
export const goLive = (campaignId) => api.put(`/api/brand/campaign/${campaignId}/go-live`);
export const getLiveMetrics = () => api.get('/api/brand/metrics');
export const markAllBrandNotificationsRead = () => api.put('/api/notifications/read-all');
