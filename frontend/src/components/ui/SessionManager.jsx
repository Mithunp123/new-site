/**
 * SessionManager — shows current session info and provides a
 * session-aware sign-out button with confirmation.
 *
 * Used inside top bars. Clicking the avatar opens a dropdown
 * showing: logged-in-as, session start time, and a Sign Out button
 * that calls the server to revoke the token before clearing local state.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, Shield, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const ROLE_COLORS = {
  admin:       { bg: '#0F172A', ring: '#334155', label: 'Super Admin',    badge: 'bg-slate-700 text-slate-200' },
  super_admin: { bg: '#0F172A', ring: '#334155', label: 'Super Admin',    badge: 'bg-slate-700 text-slate-200' },
  moderator:   { bg: '#1E3A5F', ring: '#2563EB', label: 'Moderator',      badge: 'bg-blue-900 text-blue-200' },
  brand:       { bg: '#4C1D95', ring: '#7C3AED', label: 'Brand Account',  badge: 'bg-purple-900 text-purple-200' },
  creator:     { bg: '#064E3B', ring: '#10B981', label: 'Creator',        badge: 'bg-emerald-900 text-emerald-200' },
};

function formatSessionAge(loginAt) {
  if (!loginAt) return 'Unknown';
  const diff = Date.now() - new Date(loginAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SessionManager({ accentColor = '#2563EB' }) {
  const { user, role, loginAt, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef(null);

  const meta = ROLE_COLORS[role] || ROLE_COLORS.creator;
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setConfirm(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    if (!confirm) { setConfirm(true); return; }
    setSigningOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      // logout clears local state even on network error
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={() => { setOpen(v => !v); setConfirm(false); }}
        className="flex items-center gap-2.5 pl-3 border-l border-slate-100 ml-1 hover:opacity-90 transition-opacity"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
          style={{ background: meta.bg, boxShadow: `0 0 0 2px ${meta.ring}` }}
        >
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-[13px] font-semibold text-slate-900 leading-tight">{user?.name || 'User'}</p>
          <p className="text-[11px] text-slate-400">{meta.label}</p>
        </div>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
          >
            {/* Session header */}
            <div className="px-4 py-3.5 border-b border-slate-50" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: meta.bg }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>
            </div>

            {/* Session info */}
            <div className="px-4 py-3 border-b border-slate-50 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={12} className="text-slate-400 flex-shrink-0" />
                <span>Session started <span className="font-semibold text-slate-700">{formatSessionAge(loginAt)}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield size={12} className="text-emerald-500 flex-shrink-0" />
                <span className="text-emerald-600 font-medium">Secure session active</span>
              </div>
            </div>

            {/* Sign out */}
            <div className="px-3 py-2.5">
              {confirm ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 px-1 font-medium">
                    This will revoke your session on all devices. Continue?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirm(false)}
                      className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {signingOut ? (
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <LogOut size={12} />
                      )}
                      {signingOut ? 'Signing out…' : 'Yes, sign out'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
