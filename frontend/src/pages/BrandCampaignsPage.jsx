import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, Eye, MessageSquare, Trash2 } from 'lucide-react';
import BrandLayout from '../components/layout/BrandLayout';
import * as brandApi from '../api/brandApi';

const statusColors = {
  request_sent: 'bg-yellow-100 text-yellow-800',
  request_accepted: 'bg-blue-100 text-blue-800',
  content_uploaded: 'bg-purple-100 text-purple-800',
  brand_approved: 'bg-green-100 text-green-800',
  posted_live: 'bg-green-100 text-green-800',
  analytics_collected: 'bg-indigo-100 text-indigo-800',
  campaign_closed: 'bg-gray-100 text-gray-800',
  disputed: 'bg-red-100 text-red-800',
};

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await brandApi.getBrandCampaigns();
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns
    .filter(c => {
      const matchesSearch = !searchTerm || 
        c.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'budget') return b.budget - a.budget;
      return 0;
    });

  return (
    <BrandLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Campaigns</h1>
          <p className="text-slate-600">Manage all your active and completed campaigns</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="request_sent">Request Sent</option>
            <option value="request_accepted">Accepted</option>
            <option value="content_uploaded">Content Uploaded</option>
            <option value="brand_approved">Brand Approved</option>
            <option value="posted_live">Posted Live</option>
            <option value="campaign_closed">Closed</option>
            <option value="disputed">Disputed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="budget">Highest Budget</option>
          </select>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading campaigns...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No campaigns found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Creator</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Campaign</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Platform</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Budget</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={campaign.creator_avatar || 'https://via.placeholder.com/40'}
                            alt={campaign.creator_name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-slate-900">{campaign.creator_name}</p>
                            <p className="text-xs text-slate-500">@{campaign.creator_handle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{campaign.title || 'Untitled'}</p>
                        <p className="text-xs text-slate-500">{campaign.deliverable}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm capitalize">
                          {campaign.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        ₹{campaign.budget?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[campaign.status] || 'bg-slate-100 text-slate-800'}`}>
                          {campaign.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition cursor-pointer" title="View Details">
                            <Eye size={18} className="text-slate-600" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition cursor-pointer" title="Message">
                            <MessageSquare size={18} className="text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </BrandLayout>
  );
}
