import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Clock, BarChart2, DollarSign } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import * as adminApi from '../api/adminApi';

const statusColors = {
  request_sent: 'bg-yellow-900 text-yellow-100',
  creator_accepted: 'bg-blue-900 text-blue-100',
  agreement_locked: 'bg-indigo-900 text-indigo-100',
  content_uploaded: 'bg-purple-900 text-purple-100',
  brand_approved: 'bg-green-900 text-green-100',
  posted_live: 'bg-green-900 text-green-100',
  analytics_collected: 'bg-indigo-900 text-indigo-100',
  escrow_released: 'bg-teal-900 text-teal-100',
  campaign_closed: 'bg-slate-900 text-slate-100',
  declined: 'bg-red-900 text-red-100',
};

const STEP_LABELS = {
  request_sent: 'Request Sent',
  creator_accepted: 'Creator Accepted',
  agreement_locked: 'Escrow Locked',
  content_uploaded: 'Content Uploaded',
  brand_approved: 'Brand Approved',
  posted_live: 'Posted Live',
  analytics_collected: 'Analytics In',
  escrow_released: 'Payment Released',
  campaign_closed: 'Closed',
};

export default function AdminCampaignManagementPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [analyticsForm, setAnalyticsForm] = useState({
    views: '', reach: '', clicks: '', conversions: '',
    engagement_rate: '', sales_generated: '', platform: 'instagram',
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchCampaigns(); }, [filterStatus]); // eslint-disable-line

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const res = await adminApi.getCampaigns(params);
      setCampaigns(res.data.data.campaigns || []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedCampaign) return;
    setActionLoading(true);
    try {
      if (actionType === 'approve') await adminApi.approveCampaign(selectedCampaign.id);
      else if (actionType === 'reject') await adminApi.rejectCampaign(selectedCampaign.id);
      else if (actionType === 'mark_live') await adminApi.markCampaignLive(selectedCampaign.id);
      else if (actionType === 'release_escrow') await adminApi.releaseEscrow(selectedCampaign.id);
      else if (actionType === 'close') await adminApi.closeCampaign(selectedCampaign.id);
      setShowActionModal(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAnalytics = async () => {
    if (!selectedCampaign) return;
    setActionLoading(true);
    try {
      await adminApi.addCampaignAnalytics(selectedCampaign.id, {
        views: Number(analyticsForm.views),
        reach: Number(analyticsForm.reach),
        clicks: Number(analyticsForm.clicks),
        conversions: Number(analyticsForm.conversions),
        engagement_rate: Number(analyticsForm.engagement_rate),
        sales_generated: Number(analyticsForm.sales_generated),
        platform: analyticsForm.platform,
      });
      setShowAnalyticsModal(false);
      setSelectedCampaign(null);
      setAnalyticsForm({ views: '', reach: '', clicks: '', conversions: '', engagement_rate: '', sales_generated: '', platform: 'instagram' });
      fetchCampaigns();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.title?.toLowerCase().includes(s) ||
      c.brand_name?.toLowerCase().includes(s) ||
      c.creator_name?.toLowerCase().includes(s)
    );
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Campaign Management</h1>
          <p className="text-slate-400">Monitor and advance campaigns through the 9-step flow</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search campaigns, brands, creators..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="request_sent">Request Sent</option>
            <option value="creator_accepted">Creator Accepted</option>
            <option value="agreement_locked">Escrow Locked</option>
            <option value="content_uploaded">Content Uploaded</option>
            <option value="brand_approved">Brand Approved</option>
            <option value="posted_live">Posted Live</option>
            <option value="analytics_collected">Analytics Collected</option>
            <option value="escrow_released">Payment Released</option>
            <option value="campaign_closed">Closed</option>
          </select>
        </div>

        {/* Action Confirm Modal */}
        {showActionModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"
            >
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                {actionType === 'approve' && '✓ Approve Content'}
                {actionType === 'reject' && '✕ Reject Campaign'}
                {actionType === 'mark_live' && '🚀 Mark as Live'}
                {actionType === 'release_escrow' && '💸 Release Escrow'}
                {actionType === 'close' && '🔒 Close Campaign'}
              </h2>
              <p className="text-slate-300 mb-2">
                Campaign: <strong>{selectedCampaign.title}</strong>
              </p>
              <p className="text-slate-400 text-sm mb-6">
                Brand: {selectedCampaign.brand_name} · Creator: {selectedCampaign.creator_name}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition text-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition disabled:opacity-50 ${
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Analytics Entry Modal */}
        {showAnalyticsModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700"
            >
              <h2 className="text-xl font-bold text-slate-100 mb-1">📊 Enter Campaign Metrics</h2>
              <p className="text-slate-400 text-sm mb-6">
                Campaign: <strong className="text-slate-200">{selectedCampaign.title}</strong> ·{' '}
                Advances to{' '}
                <span className="text-indigo-400 font-bold">Analytics Collected</span> and notifies brand to release payment.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { key: 'views', label: 'Views', placeholder: 'e.g. 50000' },
                  { key: 'reach', label: 'Reach', placeholder: 'e.g. 35000' },
                  { key: 'clicks', label: 'Clicks / Link Taps', placeholder: 'e.g. 1200' },
                  { key: 'conversions', label: 'Conversions / Leads', placeholder: 'e.g. 45' },
                  { key: 'engagement_rate', label: 'Engagement Rate %', placeholder: 'e.g. 4.2' },
                  { key: 'sales_generated', label: 'Sales Generated (₹)', placeholder: 'e.g. 85000' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 block">
                      {label}
                    </label>
                    <input
                      type="number"
                      placeholder={placeholder}
                      value={analyticsForm[key]}
                      onChange={e => setAnalyticsForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 block">
                  Platform
                </label>
                <select
                  value={analyticsForm.platform}
                  onChange={e => setAnalyticsForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition text-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAnalytics}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : '📊 Submit Metrics'}
                </button>
              </div>
            </motion.div>
          </div>
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
                    {['Campaign', 'Brand', 'Creator', 'Budget', 'Step', 'Status', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map(campaign => (
                    <tr key={campaign.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-100 text-sm">{campaign.title}</p>
                        <p className="text-xs text-slate-500">{campaign.platform}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-300 text-sm">{campaign.brand_name}</td>
                      <td className="px-4 py-4 text-slate-300 text-sm">{campaign.creator_name}</td>
                      <td className="px-4 py-4 text-slate-100 text-sm font-medium">
                        ₹{campaign.budget?.toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${((campaign.progress_step || 0) / 8) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{campaign.progress_step || 0}/8</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            statusColors[campaign.status] || 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {STEP_LABELS[campaign.status] || campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {campaign.status === 'content_uploaded' && (
                            <button
                              onClick={() => { setSelectedCampaign(campaign); setActionType('approve'); setShowActionModal(true); }}
                              className="p-1.5 hover:bg-green-900 rounded-lg transition"
                              title="Approve Content"
                            >
                              <CheckCircle size={16} className="text-green-400" />
                            </button>
                          )}
                          {campaign.status === 'brand_approved' && (
                            <button
                              onClick={() => { setSelectedCampaign(campaign); setActionType('mark_live'); setShowActionModal(true); }}
                              className="p-1.5 hover:bg-blue-900 rounded-lg transition"
                              title="Mark Live"
                            >
                              <Clock size={16} className="text-blue-400" />
                            </button>
                          )}
                          {campaign.status === 'posted_live' && (
                            <button
                              onClick={() => { setSelectedCampaign(campaign); setShowAnalyticsModal(true); }}
                              className="p-1.5 hover:bg-indigo-900 rounded-lg transition"
                              title="Enter Metrics"
                            >
                              <BarChart2 size={16} className="text-indigo-400" />
                            </button>
                          )}
                          {campaign.status === 'analytics_collected' && (
                            <button
                              onClick={() => { setSelectedCampaign(campaign); setActionType('release_escrow'); setShowActionModal(true); }}
                              className="p-1.5 hover:bg-green-900 rounded-lg transition"
                              title="Release Escrow"
                            >
                              <DollarSign size={16} className="text-green-400" />
                            </button>
                          )}
                          {campaign.status === 'escrow_released' && (
                            <button
                              onClick={() => { setSelectedCampaign(campaign); setActionType('close'); setShowActionModal(true); }}
                              className="p-1.5 hover:bg-slate-600 rounded-lg transition"
                              title="Close Campaign"
                            >
                              <XCircle size={16} className="text-slate-400" />
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
