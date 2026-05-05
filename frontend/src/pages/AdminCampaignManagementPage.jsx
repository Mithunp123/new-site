import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import * as adminApi from '../api/adminApi';

const statusColors = {
  request_sent: 'bg-yellow-900 text-yellow-100',
  request_accepted: 'bg-blue-900 text-blue-100',
  content_uploaded: 'bg-purple-900 text-purple-100',
  brand_approved: 'bg-green-900 text-green-100',
  posted_live: 'bg-green-900 text-green-100',
  analytics_collected: 'bg-indigo-900 text-indigo-100',
  campaign_closed: 'bg-slate-900 text-slate-100',
  disputed: 'bg-red-900 text-red-100',
};

export default function AdminCampaignManagementPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCampaigns();
      setCampaigns(res.data.data.campaigns || []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedCampaign) return;

    try {
      if (actionType === 'approve') {
        await adminApi.approveCampaign(selectedCampaign.id);
      } else if (actionType === 'reject') {
        await adminApi.rejectCampaign(selectedCampaign.id);
      } else if (actionType === 'mark_live') {
        await adminApi.markCampaignLive(selectedCampaign.id);
      } else if (actionType === 'release_escrow') {
        await adminApi.releaseEscrow(selectedCampaign.id);
      }

      setShowActionModal(false);
      setSelectedCampaign(null);
      fetchCampaigns();
      alert(`Campaign ${actionType.replace('_', ' ')} successfully!`);
    } catch (err) {
      console.error('Action failed:', err);
      alert('Action failed');
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = !searchTerm ||
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brand_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Campaign Management</h1>
          <p className="text-slate-400">Approve and manage campaigns</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="request_sent">Pending</option>
            <option value="brand_approved">Approved</option>
            <option value="posted_live">Live</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>

        {/* Action Modal */}
        {showActionModal && selectedCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"
            >
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                {actionType === 'approve' && 'Approve Campaign'}
                {actionType === 'reject' && 'Reject Campaign'}
                {actionType === 'mark_live' && 'Mark Campaign Live'}
                {actionType === 'release_escrow' && 'Release Escrow'}
              </h2>
              <p className="text-slate-300 mb-6">
                Are you sure you want to {actionType.replace('_', ' ')} <span className="font-bold">{selectedCampaign.title}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition text-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition cursor-pointer ${
                    actionType === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading campaigns...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No campaigns found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Campaign</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Brand</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Creator</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Budget</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-700 hover:bg-slate-700">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-100">{campaign.title}</p>
                        <p className="text-xs text-slate-400">{campaign.platform}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{campaign.brand_name}</td>
                      <td className="px-6 py-4 text-slate-300">{campaign.creator_name}</td>
                      <td className="px-6 py-4 text-slate-100 font-medium">₹{campaign.budget?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status] || 'bg-slate-900 text-slate-100'}`}>
                          {campaign.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {campaign.status === 'request_sent' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setActionType('approve');
                                  setShowActionModal(true);
                                }}
                                className="p-2 hover:bg-green-900 rounded-lg transition cursor-pointer"
                                title="Approve"
                              >
                                <CheckCircle size={18} className="text-green-400" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setActionType('reject');
                                  setShowActionModal(true);
                                }}
                                className="p-2 hover:bg-red-900 rounded-lg transition cursor-pointer"
                                title="Reject"
                              >
                                <XCircle size={18} className="text-red-400" />
                              </button>
                            </>
                          )}
                          {campaign.status === 'brand_approved' && (
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setActionType('mark_live');
                                setShowActionModal(true);
                              }}
                              className="p-2 hover:bg-blue-900 rounded-lg transition cursor-pointer"
                              title="Mark Live"
                            >
                              <Clock size={18} className="text-blue-400" />
                            </button>
                          )}
                          {campaign.status === 'analytics_collected' && (
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setActionType('release_escrow');
                                setShowActionModal(true);
                              }}
                              className="p-2 hover:bg-green-900 rounded-lg transition cursor-pointer"
                              title="Release Escrow"
                            >
                              <CheckCircle size={18} className="text-green-400" />
                            </button>
                          )}
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
    </AdminLayout>
  );
}
