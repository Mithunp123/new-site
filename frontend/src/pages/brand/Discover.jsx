import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Search, UserPlus, UserCheck, Send, SlidersHorizontal, X, ShieldCheck, MapPin, Star, TrendingUp, Eye, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCount, getAvatarColor, getInitials } from '../../utils/format';
import { getOrCreateConversation } from '../../api/chatApi';
import verificationBadge from '../../assets/Verification Badge.gif';

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
        <div className="w-full overflow-x-auto overflow-y-hidden pb-2" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex w-max min-w-full items-center gap-2 whitespace-nowrap">
          {/* Search */}
          <div className="relative flex-shrink-0 w-48 sm:w-56 lg:w-60">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search creators..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/8 transition-all"
            />
          </div>

          {/* Filter dropdowns */}
          {Object.entries(FILTER_OPTIONS).map(([key, { label, options }]) => (
            <div key={key} className="relative flex-shrink-0">
              <select
                value={filters[key]}
                onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                className={`appearance-none cursor-pointer pl-3 ${key === 'sort_by' ? 'pr-2' : 'pr-7'} py-2 rounded-lg text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 whitespace-nowrap ${
                  filters[key]
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-[0_2px_8px_rgba(124,58,237,0.25)]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${filters[key] ? 'white' : '%2394A3B8'}' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: key === 'sort_by' ? 'right 2px center' : 'right 8px center',
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
                ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-[0_2px_8px_rgba(124,58,237,0.25)]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck size={13} />
            Verified
          </button>

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
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[420px] bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : discovery?.creators?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
  const [isFollowing, setIsFollowing] = useState(creator.is_saved);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const toggleFollow = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (isFollowing) await api.delete(`/api/brand/creator/${creator.id}/save`);
      else await api.post(`/api/brand/creator/${creator.id}/save`);
      setIsFollowing(!isFollowing);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleChat = async (e) => {
    e.stopPropagation();
    setChatLoading(true);
    try {
      await getOrCreateConversation(creator.id);
      navigate('/brand/chat');
    } catch (err) { console.error(err); }
    finally { setChatLoading(false); }
  };

  const followers = Number(creator.instagram_followers || creator.youtube_subscribers || creator.top_platform_stats?.followers_count || 0);
  const er = Number(creator.top_platform_stats?.engagement_rate || 0);
  const avgViews = Number(creator.top_platform_stats?.avg_views || 0);

  return (
    <div className="group relative bg-white rounded-[32px] border border-slate-100/60 overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_rgba(124,58,237,0.06)] hover:-translate-y-1 flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-2">
      
      {/* Top Banner & Follow Button */}
      <div className="h-[100px] w-full rounded-[24px] relative overflow-hidden bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#FAFAFA]">
        <button
          onClick={toggleFollow}
          disabled={loading}
          className={`absolute right-4 top-4 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-bold transition-all z-10 disabled:opacity-50 ${
            isFollowing
              ? 'bg-[#7C3AED] text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
              : 'bg-white text-slate-700 hover:bg-[#7C3AED] hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
          }`}
        >
          {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Avatar (overlapping banner) */}
      <div className="relative -mt-[42px] px-4">
        <div className="relative inline-block">
          {creator.profile_photo ? (
            <img 
              src={creator.profile_photo} 
              alt={creator.name} 
              className="w-[84px] h-[84px] rounded-[24px] object-cover border-[6px] border-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] bg-white" 
            />
          ) : (
            <div
              className="w-[84px] h-[84px] rounded-[24px] flex items-center justify-center text-white font-extrabold text-2xl border-[6px] border-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
              style={{ backgroundColor: creator.avatar_color || '#2563EB' }}
            >
              {creator.initials || getInitials(creator.name)}
            </div>
          )}
          {/* Verification Badge */}
          {creator.is_verified && (
            <img 
              src={verificationBadge} 
              alt="Verified" 
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-white"
            />
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="text-[22px] font-extrabold text-slate-900 tracking-tight">{creator.name}</h3>
        
        {/* Platform Badges */}
        <div className="flex items-center gap-2 mt-3">
          {creator.has_instagram && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-100/50 text-pink-600 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              Instagram
            </span>
          )}
          {creator.has_youtube && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100/50 text-red-600 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              YouTube
            </span>
          )}
        </div>

        {/* Categories */}
        {creator.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {creator.categories.slice(0, 3).map((cat, i) => (
              <span key={i} className="px-3 py-1.5 bg-[#F5F3FF] text-[#7C3AED] text-[11px] font-bold rounded-[10px]">
                {cat}
              </span>
            ))}
            {creator.categories.length > 3 && (
              <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 text-[11px] font-bold rounded-[10px]">
                +{creator.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Unified Stats Grid */}
        <div className="mt-5 bg-[#FAFAFA] rounded-[20px] p-4 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-[17px] font-extrabold text-slate-900 tracking-tight">{formatCount(followers)}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Followers</p>
          </div>
          <div className="w-px h-8 bg-slate-200/60 mx-2" />
          <div className="text-center flex-1">
            <p className="text-[17px] font-extrabold text-[#10B981] tracking-tight">{er.toFixed(1)}%</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Eng Rate</p>
          </div>
          <div className="w-px h-8 bg-slate-200/60 mx-2" />
          <div className="text-center flex-1">
            <p className="text-[17px] font-extrabold text-slate-900 tracking-tight">{formatCount(avgViews)}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Views</p>
          </div>
        </div>

        {/* Platform Specific Cards */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {creator.has_instagram && creator.instagram_followers ? (
            <div className="bg-gradient-to-br from-pink-50/60 to-pink-50/20 border border-pink-100/50 rounded-[20px] p-4 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                <span className="text-[11px] font-bold text-pink-600 tracking-wide">Instagram</span>
              </div>
              <p className="text-[20px] font-extrabold text-slate-900 tracking-tight">{formatCount(Number(creator.instagram_followers))}</p>
              <p className="text-[11px] font-bold text-pink-500 mt-0.5">{Number(creator.instagram_engagement_rate || 0).toFixed(1)}% ER</p>
            </div>
          ) : null}

          {creator.has_youtube && creator.youtube_subscribers ? (
            <div className="bg-gradient-to-br from-red-50/60 to-red-50/20 border border-red-100/50 rounded-[20px] p-4 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-[11px] font-bold text-red-600 tracking-wide">YouTube</span>
              </div>
              <p className="text-[20px] font-extrabold text-slate-900 tracking-tight">{formatCount(Number(creator.youtube_subscribers))}</p>
              <p className="text-[11px] font-bold text-red-500 mt-0.5">{Number(creator.youtube_engagement_rate || 0).toFixed(1)}% ER</p>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5 pt-2">
          <button
            onClick={() => navigate('/brand/send-request', { state: { creator } })}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-[13px] rounded-[18px] shadow-[0_8px_20px_rgba(124,58,237,0.25)] hover:shadow-[0_12px_24px_rgba(124,58,237,0.35)] hover:-translate-y-0.5 transition-all"
          >
            <Send size={15} className="mr-1" /> Send Request
          </button>
          
          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="w-[52px] h-[52px] shrink-0 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-slate-600 rounded-[18px] flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-slate-100"
            title="Message creator"
          >
            <MessageCircle size={20} className={isFollowing ? 'text-[#7C3AED]' : 'text-slate-400'} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandDiscover;
