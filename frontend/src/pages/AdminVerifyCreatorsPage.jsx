import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Search, Clock, Shield, AlertTriangle, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';

// ── Inline social icons ─────────────────────────────────────────────────────
const IGIcon = ({ size = 12, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const YTIcon = ({ size = 12, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);
import * as adminApi from '../api/adminApi';
import { formatCount } from '../utils/format';

// ── Resolve follower counts from multiple possible API shapes ───────────────
const resolveFollowers = (item, platform) => {
  if (platform === 'instagram') {
    return Number(
      item.instagram_followers ??
      item.ig_followers ??
      item.social_profiles?.instagram?.followers ??
      item.social_profiles?.instagram_followers ??
      0
    );
  }
  if (platform === 'youtube') {
    return Number(
      item.youtube_followers ??
      item.yt_followers ??
      item.youtube_subscribers ??
      item.social_profiles?.youtube?.followers ??
      item.social_profiles?.youtube_followers ??
      0
    );
  }
  return 0;
};

// ── Platform pill ───────────────────────────────────────────────────────────
const PlatformPill = ({ platform, followers }) => {
  const isIG = platform === 'instagram';
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
      isIG ? 'bg-pink-50 text-pink-600' : 'bg-red-50 text-red-600'
    }`}>
      {isIG
        ? <IGIcon size={12} />
        : <YTIcon size={12} />}
      <span>{formatCount(followers)}</span>
    </div>
  );
};

// ── Creator card ────────────────────────────────────────────────────────────
const CreatorCard = ({ creator, onApprove, onReject, processing }) => {
  const [expanded, setExpanded] = useState(false);
  const igFollowers = resolveFollowers(creator, 'instagram');
  const ytFollowers = resolveFollowers(creator, 'youtube');
  const hasIG = igFollowers > 0 || creator.platforms?.includes('instagram');
  const hasYT = ytFollowers > 0 || creator.platforms?.includes('youtube');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="card overflow-hidden"
    >
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0 overflow-hidden">
          {creator.avatar
            ? <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
            : creator.name?.substring(0, 2).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 text-sm truncate">{creator.name}</p>
            {creator.category && (
              <span className="badge badge-blue text-[10px]">{creator.category}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {hasIG && <PlatformPill platform="instagram" followers={igFollowers} />}
            {hasYT && <PlatformPill platform="youtube"   followers={ytFollowers} />}
            {!hasIG && !hasYT && (
              <span className="text-xs text-slate-400 italic">No social profiles linked</span>
            )}
          </div>
        </div>

        {/* Submitted date */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
          <Clock size={12} />
          {new Date(creator.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="btn-ghost p-2 text-slate-400"
            title="View details"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            disabled={!!processing}
            onClick={() => onReject(creator.id)}
            className="btn-secondary py-1.5 px-3 text-xs text-red-500 border-red-100 hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle size={14} />
            Reject
          </button>
          <button
            disabled={!!processing}
            onClick={() => onApprove(creator.id)}
            className="btn-primary py-1.5 px-3 text-xs disabled:opacity-50"
          >
            {processing === creator.id ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Approving…
              </span>
            ) : (
              <>
                <CheckCircle size={14} />
                Approve
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-xs text-slate-700 truncate">{creator.email || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">IG Followers</p>
                <p className="text-xs font-bold text-pink-600">{igFollowers > 0 ? formatCount(igFollowers) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">YT Subscribers</p>
                <p className="text-xs font-bold text-red-600">{ytFollowers > 0 ? formatCount(ytFollowers) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Joined</p>
                <p className="text-xs text-slate-700">{new Date(creator.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Page ────────────────────────────────────────────────────────────────────
export default function AdminVerifyCreatorsPage() {
  const [creators, setCreators]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [processing, setProcessing] = useState(null);
  const [toast, setToast]           = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCreators({ status: 'unverified' });
      setCreators(res.data.data.creators || []);
    } catch (err) {
      console.error('Failed to fetch pending creators:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await adminApi.verifyCreator(id);
      setCreators(prev => prev.filter(c => c.id !== id));
      window.dispatchEvent(new Event('admin:counts-refresh'));
      showToast('Creator approved successfully');
    } catch (err) {
      console.error(err);
      showToast('Failed to approve creator', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await adminApi.deactivateCreator(id);
      setCreators(prev => prev.filter(c => c.id !== id));
      window.dispatchEvent(new Event('admin:counts-refresh'));
      showToast('Creator rejected');
    } catch (err) {
      console.error(err);
      showToast('Failed to reject creator', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = creators.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {toast.type === 'error'
              ? <AlertTriangle size={16} />
              : <CheckCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Verify Creators</h1>
          <p className="page-subtitle">Review and approve pending creator applications</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-orange">
            <Clock size={11} />
            {creators.length} Pending
          </span>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Awaiting Review', value: creators.length,  color: 'text-amber-600',  bg: 'bg-amber-50',  icon: Clock },
          { label: 'Verified Today',  value: 0,                color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Shield },
          { label: 'Rejected Today',  value: 0,                color: 'text-red-500',    bg: 'bg-red-50',    icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Creator list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-20 text-center">
          <Shield size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 font-medium">
            {search ? 'No creators match your search' : 'No pending creators — all caught up!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(creator => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                onApprove={handleApprove}
                onReject={handleReject}
                processing={processing}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
