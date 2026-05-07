import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, CheckCircle2, Bookmark, Send, SlidersHorizontal, X, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCount, getAvatarColor, getInitials } from '../../utils/format';

const FILTER_OPTIONS = {
  niche:        { label: 'Niche',       options: ['Fashion', 'Tech', 'Lifestyle', 'Gaming', 'Music', 'Food', 'Beauty', 'Travel', 'Finance', 'Education'] },
  platform:     { label: 'Platform',    options: ['Instagram', 'YouTube', 'Both'] },
  followers:    { label: 'Followers',   options: ['1K–10K', '10K–100K', '100K–1M', '1M+'] },
  min_er:       { label: 'Engagement',  options: ['1–3%', '3–5%', '5%+'] },
  location:     { label: 'Location',    options: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pan India'] },
  budget:       { label: 'Budget',      options: ['₹5K–₹25K', '₹25K–₹1L', '₹1L+'] },
  language:     { label: 'Language',    options: ['Any', 'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Bengali'] },
  content_type: { label: 'Content',     options: ['Reels', 'Stories', 'Posts', 'YouTube', 'Shorts'] },
  sort_by:      { label: 'Sort By',     options: ['Most Followers', 'Highest ER', 'Most Affordable', 'Best ROI'] },
};

const EMPTY_FILTERS = {
  niche: '', platform: '', followers: '', min_er: '', location: '',
  budget: '', language: '', content_type: '', sort_by: '', verified_only: false,
};

const BrandDiscover = () => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState('');

  const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'verified_only' ? !!v : v).length;

  const { data: discovery, isLoading, refetch } = useQuery({
    queryKey: ['brand-discover', filters, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (k === 'verified_only') { if (v) params.append(k, 'true'); }
        else if (v) params.append(k, v);
      });
      if (search) params.append('search', search);
      const res = await api.get(`/api/brand/discover?${params.toString()}`);
      return res.data.data;
    },
  });

  const clearAll = () => setFilters(EMPTY_FILTERS);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Discover Creators</h1>
          <p className="page-subtitle">
            {isLoading ? 'Loading...' : `${discovery?.total || 0} verified creators available`}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {/* Search */}
          <div className="relative flex-shrink-0 w-52">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search creators..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]/40 focus:ring-2 focus:ring-[#2563EB]/8 transition-all"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-7 bg-slate-200 flex-shrink-0" />

          {/* Filter dropdowns */}
          {Object.entries(FILTER_OPTIONS).map(([key, { label, options }]) => (
            <div key={key} className="relative flex-shrink-0">
              <select
                value={filters[key]}
                onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                className={`appearance-none cursor-pointer pl-3 pr-7 py-2 rounded-lg text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 whitespace-nowrap ${
                  filters[key]
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${filters[key] ? 'white' : '%2394A3B8'}' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                <option value="">{label}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}

          {/* Verified Only toggle */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, verified_only: !prev.verified_only }))}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
              filters.verified_only
                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck size={13} />
            Verified
          </button>

          {/* Divider */}
          <div className="w-px h-7 bg-slate-200 flex-shrink-0" />

          {/* Clear */}
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X size={13} /> Clear {activeCount}
            </button>
          )}

          <button onClick={() => refetch()} className="btn-primary flex-shrink-0 py-2 ml-auto">
            <SlidersHorizontal size={14} /> Apply
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : discovery?.creators?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {discovery.creators.map((creator, i) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <CreatorCard creator={creator} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center border-dashed">
          <Search size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">No creators found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search term</p>
          {activeCount > 0 && (
            <button onClick={clearAll} className="btn-secondary mt-4 mx-auto">Clear filters</button>
          )}
        </div>
      )}
    </motion.div>
  );
};

const CreatorCard = ({ creator }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(creator.is_saved);

  const toggleSave = async (e) => {
    e.stopPropagation();
    try {
      if (isSaved) await api.delete(`/api/brand/creator/${creator.id}/save`);
      else await api.post(`/api/brand/creator/${creator.id}/save`);
      setIsSaved(!isSaved);
    } catch (err) { console.error(err); }
  };

  const followers = Number(creator.instagram_followers || creator.youtube_subscribers || 0);
  const er = Number(creator.top_platform_stats?.engagement_rate || 0);
  const avgViews = Number(creator.top_platform_stats?.avg_views || 0);

  return (
    <div className="card-hover p-5 relative flex flex-col h-full">
      {/* Bookmark */}
      <button
        onClick={toggleSave}
        className={`absolute right-4 top-4 p-1.5 rounded-lg transition-all z-10 ${
          isSaved ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300 hover:text-slate-500'
        }`}
      >
        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
      </button>

      {/* Creator info */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-shrink-0">
          {creator.profile_photo ? (
            <img src={creator.profile_photo} alt={creator.name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: creator.avatar_color || '#2563EB' }}
            >
              {creator.initials || getInitials(creator.name)}
            </div>
          )}
          {creator.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] fill-[#2563EB]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-[13px] font-semibold text-slate-900 truncate">{creator.name}</h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">{creator.display_name || creator.location || '—'}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {creator.has_instagram && (
              <span className="text-[10px] font-semibold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded">IG</span>
            )}
            {creator.has_youtube && (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">YT</span>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      {creator.categories?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {creator.categories.slice(0, 2).map((cat, i) => (
            <span key={i} className="badge badge-blue text-[10px]">{cat}</span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 mb-4">
        <div className="text-center">
          <p className="text-[13px] font-bold text-slate-900">{formatCount(followers)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Followers</p>
        </div>
        <div className="text-center border-x border-slate-100">
          <p className="text-[13px] font-bold text-emerald-600">{er.toFixed(1)}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Eng. Rate</p>
        </div>
        <div className="text-center">
          <p className="text-[13px] font-bold text-slate-900">{formatCount(avgViews)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Avg Views</p>
        </div>
      </div>

      <button
        onClick={() => navigate('/brand/send-request', { state: { creator } })}
        className="btn-primary w-full justify-center mt-auto"
      >
        <Send className="w-3.5 h-3.5" /> Send Request
      </button>
    </div>
  );
};

export default BrandDiscover;
