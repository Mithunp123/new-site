import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, AlertCircle, Filter, Download, MessageSquare } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import * as adminApi from '../api/adminApi';

const disputeStyles = {
  open: 'bg-red-50 text-red-600',
  in_progress: 'bg-orange-50 text-orange-600',
  resolved: 'bg-green-50 text-green-600',
  closed: 'bg-gray-50 text-gray-400',
};

export default function AdminDisputeManagementPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionType, setResolutionType] = useState('refund');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDisputes();
      setDisputes(res.data.disputes || []);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolution) {
      alert('Please enter resolution notes');
      return;
    }

    try {
      await adminApi.resolveDispute(selectedDispute.id, {
        resolution_type: resolutionType,
        resolution_notes: resolution,
      });

      setShowResolveModal(false);
      setSelectedDispute(null);
      setResolution('');
      fetchDisputes();
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
    }
  };

  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = !searchTerm ||
      d.campaign_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.creator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 font-jakarta tracking-tight">Dispute Management</h1>
          <p className="text-gray-500 font-medium mt-1">Review and resolve campaign disputes</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm flex items-center gap-2">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
          <input
            type="text"
            placeholder="Search by campaign, brand or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border-none text-gray-700 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-11 pr-10 py-2.5 bg-[#F8FAFC] border-none text-gray-700 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">Under Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400 font-bold">Fetching disputes...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="p-20 text-center">
            <p className="text-gray-400 font-bold text-lg">No active disputes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase border-b border-gray-50">
                  <th className="px-8 py-5">Dispute Details</th>
                  <th className="px-8 py-5">Parties Involved</th>
                  <th className="px-8 py-5">Amount</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDisputes.map((dispute) => (
                  <tr key={dispute.id} className="group hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-8 py-5">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{dispute.reason || 'Content not as brief'}</p>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{dispute.campaign_title}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">{dispute.brand_name}</span>
                        <span className="text-gray-300">vs</span>
                        <span className="text-xs font-bold text-gray-700">{dispute.creator_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-gray-900">₹{dispute.amount?.toLocaleString() || '18,000'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${disputeStyles[dispute.status] || 'bg-gray-50'}`}>
                        {dispute.status?.replace(/_/g, ' ') || 'Open'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {dispute.status !== 'resolved' && (
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowResolveModal(true);
                            }}
                            className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                          >
                            Resolve
                          </button>
                        )}
                        <button className="p-2 hover:bg-gray-100 text-gray-400 rounded-xl transition-all">
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-gray-100"
          >
            <h2 className="text-2xl font-black text-gray-900 font-jakarta mb-6">Resolve Dispute</h2>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Resolution Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['refund', 'payment', 'split', 'review'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setResolutionType(type)}
                      className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                        resolutionType === type 
                        ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' 
                        : 'border-gray-100 bg-[#F8FAFC] text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Resolution Notes</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe the final resolution..."
                  className="w-full px-5 py-4 bg-[#F8FAFC] border-none text-gray-700 placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[120px]"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDispute}
                className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Submit Resolution
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
