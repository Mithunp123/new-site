// Brand chat page — same conversation-based messaging as creator
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, ChevronLeft, Circle, Search } from 'lucide-react';
import { getConversations, getMessages, sendMessage } from '../../api/chatApi';
import { useAuth } from '../../hooks/useAuth';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

export default function BrandChatPage() {
  const { user } = useAuth();
  const [activeConvId, setActiveConvId] = useState(null);
  const [draft, setDraft] = useState('');
  const [wsMessages, setWsMessages] = useState({});
  const [search, setSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeoutState] = useState(null);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => getConversations().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: dbMessages = [] } = useQuery({
    queryKey: ['chat-messages', activeConvId],
    queryFn: () => getMessages(activeConvId).then(r => r.data.data),
    enabled: !!activeConvId,
  });

  const allMessages = activeConvId
    ? mergeMessages(dbMessages, wsMessages[activeConvId] || [])
    : [];

  const sendMut = useMutation({
    mutationFn: ({ convId, message }) => sendMessage(convId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeConvId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });

  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  useEffect(() => {
    const token = localStorage.getItem('gradix_token');
    if (!token) return;

    let reconnectTimer = null;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        conversationsRef.current.forEach(c => {
          const rid = c.conversation_id || c.campaign_id;
          if (rid) ws.send(JSON.stringify({ type: 'subscribe', conversation_id: String(rid) }));
        });
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'chat') {
            const cid = msg.conversation_id || msg.campaign_id;
            setWsMessages(prev => {
              const existing = prev[cid] || [];
              if (msg.id && existing.find(m => m.id === msg.id)) return prev;
              return { ...prev, [cid]: [...existing, msg] };
            });
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
          }
          if (msg.type === 'typing') {
            if (msg.sender_id !== user?.id) {
              setIsTyping(msg.is_typing);
              if (msg.is_typing) {
                setTimeout(() => setIsTyping(false), 3000);
              }
            }
          }
        } catch { /* ignore */ }
      };

      ws.onclose = (e) => {
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
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (activeConvId && wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', conversation_id: String(activeConvId) }));
      wsRef.current.send(JSON.stringify({ type: 'mark_read', conversation_id: String(activeConvId) }));
    }
    if (activeConvId) {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeConvId] });
    }
  }, [activeConvId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = useCallback(() => {
    if (!draft.trim() || !activeConvId) return;
    const message = draft.trim();
    setDraft('');
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'chat', conversation_id: String(activeConvId), message }));
    } else {
      sendMut.mutate({ convId: activeConvId, message });
    }
  }, [draft, activeConvId, sendMut]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTyping = () => {
    if (wsRef.current?.readyState === 1 && activeConvId) {
      wsRef.current.send(JSON.stringify({ type: 'typing', conversation_id: String(activeConvId), is_typing: true }));
      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ type: 'typing', conversation_id: String(activeConvId), is_typing: false }));
      }, 2000);
      setTypingTimeoutState(timeout);
    }
  };

  const activeConv = conversations.find(c => (c.conversation_id || c.campaign_id) === activeConvId);

  const filteredConvs = conversations.filter(c =>
    !search || c.other_user_name?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">Chat with your campaign creators</p>
        </div>
      </div>

      <div className="card flex overflow-hidden" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        {/* Conversation List */}
        <div className={`w-80 flex-shrink-0 border-r border-slate-100 flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/8"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                <MessageSquare size={36} className="mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-500">No conversations yet</p>
                <p className="text-xs mt-1 text-slate-400">Follow a creator to start chatting</p>
              </div>
            ) : (
              filteredConvs.map(conv => {
                const convId = conv.conversation_id || conv.campaign_id;
                return (
                  <button
                    key={convId}
                    onClick={() => setActiveConvId(convId)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 text-left transition-colors ${
                      activeConvId === convId ? 'bg-purple-50 border-l-2 border-l-[#7C3AED]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] font-bold text-sm flex-shrink-0">
                      {conv.other_user_photo ? (
                        <img src={conv.other_user_photo} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        conv.other_user_name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 truncate">{conv.other_user_name}</span>
                        {conv.unread_count > 0 && (
                          <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{conv.title}</p>
                      {conv.last_message && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{conv.last_message}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread */}
        {activeConvId ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-white">
              <button
                onClick={() => setActiveConvId(null)}
                className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] font-bold text-sm flex-shrink-0">
                {activeConv?.other_user_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{activeConv?.other_user_name}</p>
                <div className="flex items-center gap-1.5">
                  <Circle size={7} className="text-green-500 fill-green-500" />
                  <span className="text-xs text-slate-400">{activeConv?.title}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/30">
              {allMessages.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-12">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              )}
              {allMessages.map((msg, i) => {
                const isMe = msg.sender_type === 'brand';
                return (
                  <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe
                        ? 'bg-[#7C3AED] text-white rounded-br-sm'
                        : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
                    }`}>
                      <p className="leading-relaxed break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 px-4 py-2.5 rounded-2xl rounded-bl-sm border border-slate-100 text-sm flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-xs text-slate-400 ml-1">typing...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex gap-3 items-end">
              <textarea
                value={draft}
                onChange={e => { setDraft(e.target.value); handleTyping(); }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED]/40 max-h-28 transition-all"
                style={{ minHeight: '42px' }}
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="w-10 h-10 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-[0_2px_8px_rgba(124,58,237,0.3)]"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-base font-medium text-slate-500">Select a conversation</p>
            <p className="text-sm text-slate-400 mt-1">Choose from your followed creators on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}

function mergeMessages(dbMsgs, wsMsgs) {
  const map = new Map();
  [...dbMsgs, ...wsMsgs].forEach(m => {
    if (m.id) map.set(m.id, m);
    else map.set(m.created_at + m.message, m);
  });
  return Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
