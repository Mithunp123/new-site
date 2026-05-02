import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Flag, MoreVertical, Filter, Download } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import * as adminApi from '../api/adminApi';

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCreators();
      setCreators(res.data.creators || []);
    } catch (err) {
      console.error('Failed to fetch creators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedCreator) return;

    try {
      if (actionType === 'verify') {
        await adminApi.verifyCreator(selectedCreator.id);
      } else if (actionType === 'flag') {
        await adminApi.flagCreator(selectedCreator.id, { reason: 'Suspicious activity' });
      } else if (actionType === 'deactivate') {
        await adminApi.deactivateCreator(selectedCreator.id);
      }

      setShowActionModal(false);
      setSelectedCreator(null);
      fetchCreators();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const filteredCreators = creators.filter(c => {
    const matchesSearch = !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.handle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.verification_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 font-jakarta tracking-tight">Creator Management</h1>
          <p className="text-gray-500 font-medium mt-1">Monitor and moderate platform creators</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm flex items-center gap-2">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, handle or niche..."
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
              <option value="verified">Verified</option>
              <option value="unverified">Pending</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400 font-bold">Fetching creators...</p>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="p-20 text-center">
            <p className="text-gray-400 font-bold text-lg">No creators found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase border-b border-gray-50">
                  <th className="px-8 py-5">Creator</th>
                  <th className="px-8 py-5">Niche</th>
                  <th className="px-8 py-5">Followers</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCreators.map((creator) => (
                  <tr key={creator.id} className="group hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-black text-xs overflow-hidden">
                          {creator.avatar ? (
                            <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                          ) : (
                            creator.name?.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{creator.name}</p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">@{creator.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{creator.category || 'Niche'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-gray-900">{creator.followers_count?.toLocaleString() || '0'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        creator.verification_status === 'verified'
                          ? 'bg-green-50 text-green-600'
                          : creator.verification_status === 'flagged'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        {creator.verification_status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {creator.verification_status !== 'verified' && (
                          <button
                            onClick={() => {
                              setSelectedCreator(creator);
                              setActionType('verify');
                              setShowActionModal(true);
                            }}
                            className="p-2 hover:bg-green-50 text-green-600 rounded-xl transition-all"
                            title="Verify Profile"
                          >
                            <CheckCircle size={20} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedCreator(creator);
                            setActionType('flag');
                            setShowActionModal(true);
                          }}
                          className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-all"
                          title="Flag as Fake"
                        >
                          <Flag size={20} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 text-gray-400 rounded-xl transition-all">
                          <MoreVertical size={20} />
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

      {/* Action Modal */}
      {showActionModal && selectedCreator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100"
          >
            <h2 className="text-2xl font-black text-gray-900 font-jakarta mb-2 capitalize">
              {actionType} Creator
            </h2>
            <p className="text-gray-500 font-medium mb-8">
              Confirm {actionType}ing <span className="text-gray-900 font-bold">{selectedCreator.name}</span>. This action will be logged.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 px-6 py-3 text-white font-bold rounded-2xl shadow-lg transition-all ${
                  actionType === 'verify' ? 'bg-[#2563EB] shadow-blue-100' : 'bg-red-600 shadow-red-100'
                }`}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
