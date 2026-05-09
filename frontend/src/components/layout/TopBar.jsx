import React, { useEffect, useState, useRef } from 'react';
import { Bell, Search } from 'lucide-react';
import SessionManager from '../ui/SessionManager';
import useAuthStore from '../../store/authStore';
import * as creatorApi from '../../api/creatorApi';
import * as brandApi from '../../api/brandApi';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopBar() {
  const { role } = useAuthStore();
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readAllError, setReadAllError]   = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        let res;
        if (role === 'brand') res = await brandApi.getBrandNotifications();
        else res = await creatorApi.getNotifications();
        setNotifications(res.data.data || res.data);
      } catch (e) { /* ignore */ }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [role]);

  const markRead = async (id) => {
    try {
      if (role === 'brand') await brandApi.markBrandNotificationRead(id);
      else await creatorApi.markNotificationRead(id);
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
    } catch { }
  };

  const markAllMut = useMutation({
    mutationFn: () => {
      if (role === 'brand') return brandApi.markAllBrandNotificationsRead();
      return creatorApi.markAllNotificationsRead();
    },
    onSuccess: () => {
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
      setReadAllError('');
    },
    onError: () => setReadAllError('Failed to mark all as read'),
  });

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="relative max-w-xs w-full">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-[#2563EB]/40 transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-2" ref={ref}>
        <div className="relative">
          <button onClick={() => setOpen(v => !v)} className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
            <Bell size={17} />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.12 }} className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-sm font-semibold">Notifications</span>
                  {hasUnread && (
                    <button
                      onClick={() => markAllMut.mutate()}
                      disabled={markAllMut.isPending}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      {markAllMut.isPending ? 'Marking...' : 'Read All'}
                    </button>
                  )}
                </div>
                {readAllError && (
                  <div className="px-3 py-1 text-xs text-red-500 bg-red-50">{readAllError}</div>
                )}
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="p-4 text-xs text-slate-500">No notifications</div>
                  )}
                  {notifications.map(n => (
                    <div key={n.id} className={`p-3 border-b flex items-start gap-3 ${n.is_read ? 'bg-white' : 'bg-slate-50'}`}>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{n.title}</div>
                        <div className="text-xs text-slate-500">{n.message}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex-shrink-0">
                        {!n.is_read && (
                          <button onClick={() => markRead(n.id)} className="text-xs text-blue-600 px-2 py-1 rounded-lg">Mark</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 text-center text-xs text-slate-500">View all in Settings</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <SessionManager accentColor="#2563EB" />
      </div>
    </header>
  );
}
