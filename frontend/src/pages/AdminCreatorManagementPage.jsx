import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle, XCircle, Flag, Filter,
  Download,
} from 'lucide-react';

// ── Inline social icons (lucide-react doesn't include these) ───────────────
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
      item.social_profiles?.youtube?.subscribers ??
      item.social_profiles?.youtube?.followers ??
      item.social_profiles?.youtube_followers ??
      0
    );
  }
  return 0;
};

const STATUS_STYLES = {
  verified:   'badge-green',
  flagged:    'badge-red',
  inactive:   'badge-red',
  unverified: 'badge-orange',
};

export default function AdminCreatorsPage() {
  const [creators, setCreators]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [actionType, setActionType]       = useState('');
  const [processingId, setProcessingId]   = useState(null);

  useEffect(() => { fetchCreators(); }, []);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCreators();
      setCreators(res.data.data.creators || []);
    } catch (err) {
      console.error('Failed to fetch creators:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (creator, type) => {
    setSelectedCreator(creator);
    setActionType(type);
    setShowModal(true);
  };

  const handleAction = async () => {
    if (!selectedCreator) return;
    setProcessingId(selectedCreator.id);
    try {
      if (actionType === 'verify')     await adminApi.verifyCreator(selectedCreator.id);
      if (actionType === 'flag')       await adminApi.flagCreator(selectedCreator.id, { reason: 'Suspicious activity' });
      if (actionType === 'deactivate') await adminApi.deactivateCreator(selectedCreator.id);
      setShowModal(false);
      setSelectedCreator(null);
      fetchCreators();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = creators.filter(c => {
    const matchSearch = !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.verification_status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Creator Management</h1>
          <p className="page-subtitle">Monitor and moderate platform creators</p>
        </div>
        <button className="btn-secondary">
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <Search size={15} className="shrink-0 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, handle or category…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex min-w-[190px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <Filter size={15} className="shrink-0 text-slate-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading creators…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400 text-sm">No creators match your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Category</th>
                  <th>Reach</th>
                  <th>Status</th>
                  <th className="w-[180px] text-left pl-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(creator => {
                  const igF = resolveFollowers(creator, 'instagram');
                  const ytF = resolveFollowers(creator, 'youtube');
                  return (
                    <tr key={creator.id}>
                      {/* Creator */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs flex-shrink-0 overflow-hidden">
                            {creator.avatar
                              ? <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                              : creator.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{creator.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {creator.platforms?.includes('instagram') && (
                                <IGIcon size={10} className="text-pink-400" />
                              )}
                              {creator.platforms?.includes('youtube') && (
                                <YTIcon size={10} className="text-red-500" />
                              )}
                              {creator.handle && (
                                <span className="text-[10px] text-slate-400">@{creator.handle}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="badge badge-blue">{creator.category || 'Niche'}</span>
                      </td>

                      {/* Reach */}
                      <td>
                        <div className="space-y-1">
                          {igF > 0 && (
                            <div className="flex items-center gap-1.5">
                              <IGIcon size={10} className="text-pink-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-slate-700">{formatCount(igF)}</span>
                            </div>
                          )}
                          {ytF > 0 && (
                            <div className="flex items-center gap-1.5">
                              <YTIcon size={10} className="text-red-500 flex-shrink-0" />
                              <span className="text-xs font-semibold text-slate-700">{formatCount(ytF)}</span>
                            </div>
                          )}
                          {igF === 0 && ytF === 0 && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${STATUS_STYLES[creator.verification_status] || 'badge-gray'}`}>
                          {creator.verification_status || 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="align-middle whitespace-nowrap text-left pl-6">
                        <div className="inline-flex items-center justify-start gap-1.5">
                          {creator.verification_status !== 'verified' && (
                            <button
                              onClick={() => openModal(creator, 'verify')}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-emerald-50 text-emerald-500 transition-colors"
                              title="Verify"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => openModal(creator, 'flag')}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-red-50 text-red-400 transition-colors"
                            title="Flag"
                          >
                            <Flag size={16} />
                          </button>
                          <button
                            onClick={() => openModal(creator, 'deactivate')}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                            title="Deactivate"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {showModal && selectedCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-sm"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-1 capitalize">{actionType} Creator</h2>
              <p className="text-sm text-slate-500 mb-6">
                Confirm {actionType}ing{' '}
                <span className="font-semibold text-slate-900">{selectedCreator.name}</span>.
                This action will be logged.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={!!processingId}
                  className={`flex-1 ${actionType === 'verify' ? 'btn-primary' : 'btn-danger'} disabled:opacity-50`}
                >
                  {processingId ? '…' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
