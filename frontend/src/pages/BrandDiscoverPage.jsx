import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Heart, Mail, MoreVertical } from 'lucide-react';
import BrandLayout from "../components/layout/BrandLayout";
import * as brandApi from "../api/brandApi";

export default function BrandDiscoverPage() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    niche: '',
    platform: '',
    min_followers: '',
    max_followers: '',
    min_er: '',
    max_er: '',
    location: '',
    page: 1,
    limit: 12
  });

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true);
      try {
        const res = await brandApi.discoverCreators(filters);
        setCreators(res.data.creators);
      } catch (err) {
        console.error('Failed to fetch creators:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSaveCreator = async (creatorId) => {
    try {
      await brandApi.saveCreator(creatorId);
      // Update local state
      setCreators(prev =>
        prev.map(c => c.id === creatorId ? { ...c, is_saved: true } : c)
      );
    } catch (err) {
      console.error('Failed to save creator:', err);
    }
  };

  return (
    <BrandLayout>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Creator Discovery</h1>
        <p className="text-slate-600 mt-1">Find the perfect creator for your campaign</p>
      </motion.div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 flex-shrink-0"
        >
          <div className="bg-white rounded-xl p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Filter size={20} />
              Filters
            </h3>

            {/* Niche Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Niche</label>
              <select
                name="niche"
                value={filters.niche}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Niches</option>
                <option value="Beauty">Beauty</option>
                <option value="Fashion">Fashion</option>
                <option value="Food">Food</option>
                <option value="Tech">Tech</option>
                <option value="Fitness">Fitness</option>
                <option value="Travel">Travel</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Platform</label>
              <select
                name="platform"
                value={filters.platform}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>

            {/* Followers Range */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Followers</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="min_followers"
                  placeholder="Min"
                  value={filters.min_followers}
                  onChange={handleFilterChange}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <input
                  type="number"
                  name="max_followers"
                  placeholder="Max"
                  value={filters.max_followers}
                  onChange={handleFilterChange}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* ER Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Engagement Rate</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="min_er"
                  placeholder="Min %"
                  value={filters.min_er}
                  onChange={handleFilterChange}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <input
                  type="number"
                  name="max_er"
                  placeholder="Max %"
                  value={filters.max_er}
                  onChange={handleFilterChange}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Search location..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setFilters({
                niche: '', platform: '', min_followers: '', max_followers: '',
                min_er: '', max_er: '', location: '', page: 1, limit: 12
              })}
              className="w-full py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </motion.div>

        {/* Creator Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1"
        >
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-slate-500">Loading creators...</div>
            </div>
          ) : creators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Avatar Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <img
                        src={creator.profile_photo || 'https://via.placeholder.com/60'}
                        alt={creator.name}
                        className="w-16 h-16 rounded-full"
                      />
                      <h3 className="mt-3 font-semibold text-slate-900">{creator.name}</h3>
                      <p className="text-sm text-slate-600">@{creator.display_name}</p>
                    </div>
                    {creator.is_verified && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <p className="text-xs text-slate-600 mb-4">📍 {creator.location || 'Not specified'}</p>

                  {/* Platform Stats */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{creator.platform || 'N/A'}</span>
                      <span className="font-semibold text-slate-900">
                        {(creator.followers_count / 1000).toFixed(0)}K followers
                      </span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{creator.followers_count}</p>
                      <p className="text-xs text-slate-600">Followers</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{creator.avg_views}</p>
                      <p className="text-xs text-slate-600">Avg Views</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{creator.engagement_rate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-600">ER</p>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {creator.categories.slice(0, 2).map((cat, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                      View Profile
                    </button>
                    <button
                      onClick={() => handleSaveCreator(creator.id)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        creator.is_saved
                          ? 'bg-red-100 text-red-600'
                          : 'text-slate-400 hover:text-red-600'
                      }`}
                    >
                      <Heart size={20} fill={creator.is_saved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600">No creators found matching your filters</p>
            </div>
          )}
        </motion.div>
      </div>
    </BrandLayout>
  );
}
