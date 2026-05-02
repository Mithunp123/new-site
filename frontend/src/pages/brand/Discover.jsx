import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Search, Filter, CheckCircle2, MapPin, 
  Users, BarChart2, Eye, Bookmark, Send 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCount, getAvatarColor, getInitials } from '../../utils/format';

const BrandDiscover = () => {
  const [filters, setFilters] = useState({
    niche: '',
    platform: '',
    followers: '',
    min_er: '',
    location: '',
    budget: '',
    language: ''
  });

  const { data: discovery, isLoading, refetch } = useQuery({
    queryKey: ['brand-discover', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await axios.get(`/api/brand/discover?${params.toString()}`);
      return res.data.data;
    }
  });

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-dm">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 font-jakarta">Creator Discovery</h1>
          <p className="text-gray-500 font-medium">{discovery?.total || 0} verified creators match your filters</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
          <Bookmark className="w-5 h-5" />
          Save Search
        </button>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <FilterSelect name="niche" value={filters.niche} onChange={handleFilterChange} label="All Niches" options={['Beauty', 'Lifestyle', 'Fashion', 'Tech', 'Food', 'Travel']} />
        <FilterSelect name="platform" value={filters.platform} onChange={handleFilterChange} label="All Platforms" options={['Instagram', 'YouTube', 'TikTok', 'Twitter']} />
        <FilterSelect name="followers" value={filters.followers} onChange={handleFilterChange} label="Followers" options={['1K-10K', '10K-100K', '100K-1M', '1M+']} />
        <FilterSelect name="min_er" value={filters.min_er} onChange={handleFilterChange} label="Min ER%" options={['3%', '5%', '8%', '10%']} />
        <FilterSelect name="location" value={filters.location} onChange={handleFilterChange} label="Location" options={['Mumbai', 'Delhi', 'Bangalore', 'Pan India']} />
        <FilterSelect name="budget" value={filters.budget} onChange={handleFilterChange} label="Budget" options={['₹5K-₹25K', '₹25K-₹1L', '₹1L+']} />
        <FilterSelect name="language" value={filters.language} onChange={handleFilterChange} label="Any Language" options={['Hindi', 'English', 'Tamil', 'Bengali']} />
        
        <button 
          onClick={() => refetch()}
          className="ml-auto px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
        >
          Apply Filters
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-[350px] bg-gray-50 animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {discovery?.creators?.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
};

const FilterSelect = ({ name, value, onChange, label, options }) => (
  <select 
    name={name}
    value={value}
    onChange={onChange}
    className="h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer min-w-[120px]"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
  >
    <option value="">{label}</option>
    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);

const CreatorCard = ({ creator }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(creator.is_saved);

  const toggleSave = async (e) => {
    e.preventDefault();
    try {
      if (isSaved) await axios.delete(`/api/brand/creator/${creator.id}/save`);
      else await axios.post(`/api/brand/creator/${creator.id}/save`);
      setIsSaved(!isSaved);
    } catch (err) { console.error(err); }
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 relative group transition-all hover:shadow-xl hover:shadow-blue-50/50"
    >
      {/* Top Info */}
      <div className="flex gap-3">
        <div className="relative">
          {creator.profile_photo ? (
            <img src={creator.profile_photo} alt={creator.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: creator.avatar_color }}>
              {creator.initials}
            </div>
          )}
          {creator.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 bg-white rounded-full border-2 border-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-gray-900 truncate flex items-center gap-1">
            {creator.name} {creator.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline" />}
          </h3>
          <p className="text-xs text-gray-500 font-medium truncate">
            {creator.display_name} · {creator.location}
          </p>
        </div>
      </div>

      {/* Niche Tags */}
      <div className="flex flex-wrap gap-1.5">
        {creator.categories?.slice(0, 3).map((cat, i) => (
          <span key={i} className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {cat}
          </span>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 border-t border-gray-50 pt-4">
        <div className="text-center">
          <p className="text-[14px] font-bold text-gray-900 leading-tight">{formatCount(creator.top_platform_stats.followers_count)}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Followers</p>
        </div>
        <div className="text-center border-x border-gray-50">
          <p className="text-[14px] font-bold text-green-600 leading-tight">{creator.top_platform_stats.engagement_rate.toFixed(1)}%</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Eng. Rate</p>
        </div>
        <div className="text-center">
          <p className="text-[14px] font-bold text-gray-900 leading-tight">{formatCount(creator.top_platform_stats.avg_views)}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Avg Views</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button 
          onClick={() => navigate('/brand/requests', { state: { creator } })}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Send className="w-4 h-4" />
          Send Request
        </button>
        <button 
          onClick={toggleSave}
          className={`px-3 py-2.5 border rounded-xl transition-all ${isSaved ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'}`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
};

export default BrandDiscover;
