import api from './axios';

// Auth
export const adminLogin = (data) => api.post('/api/auth/admin/login', data);
export const getAdminProfile = () => api.get('/api/admin/profile');

// Creator Management
export const getCreators = (params) => api.get('/api/admin/creators', { params });
export const getCreatorDetail = (creatorId) => api.get(`/api/admin/creator/${creatorId}`);
export const verifyCreator = (creatorId) => api.put(`/api/admin/creator/${creatorId}/verify`);
export const unverifyCreator = (creatorId) => api.put(`/api/admin/creator/${creatorId}/unverify`);
export const deactivateCreator = (creatorId, data) => api.put(`/api/admin/creator/${creatorId}/deactivate`, data || {});
export const activateCreator = (creatorId) => api.put(`/api/admin/creator/${creatorId}/activate`);
export const flagCreator = (creatorId, data) => api.put(`/api/admin/creator/${creatorId}/flag-fake`, data);
export const flagCreatorAsFake = (creatorId, data) => api.put(`/api/admin/creator/${creatorId}/flag-fake`, data);

// Brand Management
export const getBrands = (params) => api.get('/api/admin/brands', { params });
export const getBrandDetail = (brandId) => api.get(`/api/admin/brand/${brandId}`);
export const deactivateBrand = (brandId, data) => api.put(`/api/admin/brand/${brandId}/deactivate`, data);
export const activateBrand = (brandId) => api.put(`/api/admin/brand/${brandId}/activate`);

// Campaign Management
export const getCampaigns = (params) => api.get('/api/admin/campaigns', { params });
export const getCampaignDetail = (campaignId) => api.get(`/api/admin/campaign/${campaignId}`);
export const approveCampaign = (campaignId) => api.put(`/api/admin/campaign/${campaignId}/approve`);
export const rejectCampaign = (campaignId, data) => api.put(`/api/admin/campaign/${campaignId}/reject`, data || {});
export const markCampaignLive = (campaignId) => api.put(`/api/admin/campaign/${campaignId}/post-live`);
export const addCampaignAnalytics = (campaignId, data) => api.put(`/api/admin/campaign/${campaignId}/add-analytics`, data);
export const releaseEscrow = (campaignId) => api.put(`/api/admin/campaign/${campaignId}/release-escrow`);
export const closeCampaign = (campaignId) => api.put(`/api/admin/campaign/${campaignId}/close`);

// Dispute Management
export const getDisputes = (params) => api.get('/api/admin/disputes', { params });
export const getDisputeDetail = (disputeId) => api.get(`/api/admin/dispute/${disputeId}`);
export const markDisputeUnderReview = (disputeId) => api.put(`/api/admin/dispute/${disputeId}/review`);
export const resolveDispute = (disputeId, data) => api.put(`/api/admin/dispute/${disputeId}/resolve`, data);

// Commission Tracking
export const getCommissions = (params) => api.get('/api/admin/commissions', { params });
export const getCommissionsSummary = () => api.get('/api/admin/commissions/summary');

// Dashboard
export const getAdminDashboard = () => api.get('/api/admin/dashboard');

// Analytics
export const getPlatformAnalytics = () => api.get('/api/admin/analytics');
export const getSuspiciousCreators = () => api.get('/api/admin/suspicious-creators');
