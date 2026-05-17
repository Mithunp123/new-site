import api from './axios';

export const getConversations = () => api.get('/api/chat/conversations');
export const getMessages = (conversationId) => api.get(`/api/chat/${conversationId}/messages`);
export const sendMessage = (conversationId, message) => api.post(`/api/chat/${conversationId}/messages`, { message });
export const getUnreadCount = () => api.get('/api/chat/unread');
export const getOrCreateConversation = (otherUserId) => api.post('/api/chat/conversation', { other_user_id: otherUserId });
