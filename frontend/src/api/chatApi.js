import api from './axios';

export const getConversations = () => api.get('/api/chat/conversations');
export const getMessages = (campaignId) => api.get(`/api/chat/${campaignId}/messages`);
export const sendMessage = (campaignId, message) => api.post(`/api/chat/${campaignId}/messages`, { message });
export const getUnreadCount = () => api.get('/api/chat/unread');
