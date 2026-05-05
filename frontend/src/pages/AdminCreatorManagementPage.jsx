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
      setCreators(res.data.data.creators || []);
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
                  <th className="px-6 py-5 w-[30%]">Creator</th>
                  <th className="px-6 py-5 w-[20%]">Niche</th>
                  <th className="px-6 py-5 w-[15%]">Followers</th>
                  <th className="px-6 py-5 w-[15%]">Status</th>
                  <th className="px-6 py-5 w-[20%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCreators.map((creator) => (
                  <tr key={creator.id} className="group hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-black text-xs overflow-hidden flex-shrink-0">
                          {creator.avatar ? (
                            <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                          ) : (
                            creator.name?.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{creator.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {creator.platforms?.map(p => (
                              <span key={p} className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                {p === 'instagram' ? (
                                  <svg className="w-3 h-3 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                ) : p === 'youtube' ? (
                                  <svg className="w-3 h-3 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                                ) : null}
                                {p}
                              </span>
                            ))}
                            {(!creator.platforms || creator.platforms.length === 0) && (
                              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter italic">No profiles</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg uppercase tracking-tight">{creator.category || 'Niche'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between min-w-[120px]">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Instagram</span>
                          <span className="text-xs font-black text-gray-900">{creator.instagram_followers?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center justify-between min-w-[120px]">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">YouTube</span>
                          <span className="text-xs font-black text-gray-900">{creator.youtube_followers?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="h-px bg-gray-50 my-0.5"></div>
                        <div className="flex items-center justify-between min-w-[120px]">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Total</span>
                          <span className="text-sm font-black text-blue-600">{(creator.instagram_followers + creator.youtube_followers)?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        creator.verification_status === 'verified'
                          ? 'bg-green-50 text-green-600'
                          : creator.verification_status === 'flagged' || creator.verification_status === 'inactive'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        {creator.verification_status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                            <CheckCircle size={18} />
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
                          <Flag size={18} />
                        </button>
                        <div className="relative group/menu">
                          <button className="p-2 hover:bg-gray-100 text-gray-400 rounded-xl transition-all">
                            <MoreVertical size={18} />
                          </button>
                          {/* Submenu on hover or click - simplified here as a tooltip/info */}
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover/menu:block w-32 bg-[#0F172A] text-white p-2 rounded-xl text-[10px] font-bold shadow-xl z-10">
                            <button 
                              onClick={() => {
                                setSelectedCreator(creator);
                                setActionType('deactivate');
                                setShowActionModal(true);
                              }}
                              className="w-full text-left px-2 py-1.5 hover:bg-white/10 rounded-lg flex items-center gap-2"
                            >
                              <XCircle size={12} className="text-red-400" /> Deactivate
                            </button>
                          </div>
                        </div>
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
