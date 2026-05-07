import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, ChevronLeft, Circle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversations, getMessages, sendMessage, getUnreadCount } from '../../api/chatApi';
import useAuthStore from '../../store/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

export default function ChatPanel() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [draft, setDraft] = useState('');
  const [wsMessages, setWsMessages] = useState({}); // campaignId -> messages[]
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  // Unread count badge
  const { data: unreadData } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: () => getUnreadCount().then(r => r.data.data),
    refetchInterval: open ? false : 15000,
  });
  const unread = unreadData?.unread || 0;

  // Conversations list
  const { data: conversations = [] } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => getConversations().then(r => r.data.data),
    enabled: open,
    refetchInterval: 30000,
  });

  // Messages for active conversation
  const { data: dbMessages = [] } = useQuery({
    queryKey: ['chat-messages', activeCampaignId],
    queryFn: () => getMessages(activeCampaignId).then(r => r.data.data),
    enabled: !!activeCampaignId,
  });

  // Merge DB messages with WS messages
  const allMessages = activeCampaignId
    ? mergeMessages(dbMessages, wsMessages[activeCampaignId] || [])
    : [];

  // Send message mutation
  const sendMut = useMutation({
    mutationFn: ({ campaignId, message }) => sendMessage(campaignId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeCampaignId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });

  // Keep a ref to conversations so the WS onopen handler can subscribe
  // without the effect needing to re-run (and tear down the socket) every
  // time the conversations list changes length.
  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // WebSocket connection — only reconnects when the panel opens/closes,
  // not on every conversations list change (which was dropping in-flight messages).
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem('gradix_token');
    if (!token) return;

    let reconnectTimer = null;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        // Subscribe to all conversations known at connect time
        conversationsRef.current.forEach(c => {
          ws.send(JSON.stringify({ type: 'subscribe', campaign_id: String(c.campaign_id) }));
        });
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'chat') {
            setWsMessages(prev => {
              const cid = msg.campaign_id;
              const existing = prev[cid] || [];
              // Avoid duplicates by id
              if (msg.id && existing.find(m => m.id === msg.id)) return prev;
              return { ...prev, [cid]: [...existing, msg] };
            });
            queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
          }
        } catch { /* ignore */ }
      };

      ws.onclose = (e) => {
        // Auto-reconnect unless panel closed or auth error
        if (mounted && e.code !== 4001) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [open]); // eslint-disable-line

  // When the user opens a conversation, subscribe to it (in case it wasn't
  // in the list when the socket first connected) and mark messages as read.
  useEffect(() => {
    if (!activeCampaignId) return;
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', campaign_id: String(activeCampaignId) }));
      wsRef.current.send(JSON.stringify({ type: 'mark_read', campaign_id: String(activeCampaignId) }));
    }
    // Also invalidate so the unread badge clears immediately
    queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    queryClient.invalidateQueries({ queryKey: ['chat-messages', activeCampaignId] });
  }, [activeCampaignId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = useCallback(() => {
    if (!draft.trim() || !activeCampaignId) return;
    const message = draft.trim();
    setDraft('');

    // Optimistic WS send
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        campaign_id: String(activeCampaignId),
        message,
      }));
    } else {
      // Fallback to REST
      sendMut.mutate({ campaignId: activeCampaignId, message });
    }
  }, [draft, activeCampaignId, sendMut]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = conversations.find(c => c.campaign_id === activeCampaignId);
  const myType = user?.role === 'brand' ? 'brand' : 'creator';

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center transition-all hover:scale-110"
      >
        <MessageSquare size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
              {activeCampaignId ? (
                <button onClick={() => setActiveCampaignId(null)} className="flex items-center gap-2 hover:opacity-80">
                  <ChevronLeft size={18} />
                  <span className="text-sm font-bold truncate max-w-[200px]">
                    {activeConv?.title || 'Campaign Chat'}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} />
                  <span className="font-bold text-sm">Messages</span>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unread}
                    </span>
                  )}
                </div>
              )}
              <button onClick={() => setOpen(false)} className="hover:opacity-80">
                <X size={18} />
              </button>
            </div>

            {/* Conversations List */}
            {!activeCampaignId && (
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                    <MessageSquare size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">No conversations yet</p>
                    <p className="text-xs mt-1">Start a collaboration to chat with {user?.role === 'brand' ? 'creators' : 'brands'}</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.campaign_id}
                      onClick={() => setActiveCampaignId(conv.campaign_id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 text-left transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {conv.other_user_photo ? (
                          <img src={conv.other_user_photo} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          conv.other_user_name?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 truncate">{conv.other_user_name}</span>
                          {conv.unread_count > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{conv.title}</p>
                        {conv.last_message && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{conv.last_message}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Messages View */}
            {activeCampaignId && (
              <>
                {/* Other user info */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <Circle size={8} className="text-green-500 fill-green-500" />
                  <span className="text-xs text-slate-500 font-medium">{activeConv?.other_user_name}</span>
                  <span className="text-xs text-slate-400">· {activeConv?.title}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {allMessages.length === 0 && (
                    <div className="text-center text-slate-400 text-xs py-8">
                      No messages yet. Say hello! 👋
                    </div>
                  )}
                  {allMessages.map((msg, i) => {
                    const isMe = msg.sender_type === myType;
                    return (
                      <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                          }`}
                        >
                          <p className="leading-relaxed break-words">{msg.message}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-slate-100 flex gap-2">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send)"
                    rows={1}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 max-h-24"
                    style={{ minHeight: '40px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim()}
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function mergeMessages(dbMsgs, wsMsgs) {
  const map = new Map();
  [...dbMsgs, ...wsMsgs].forEach(m => {
    if (m.id) map.set(m.id, m);
    else map.set(m.created_at + m.message, m);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
