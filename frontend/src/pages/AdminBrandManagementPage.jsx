import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import * as adminApi from '../api/adminApi';

export default function AdminBrandManagementPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getBrands();
      setBrands(res.data.data.brands || []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedBrand) return;

    try {
      if (actionType === 'activate') {
        await adminApi.activateBrand(selectedBrand.id);
      } else if (actionType === 'deactivate') {
        await adminApi.deactivateBrand(selectedBrand.id);
      }

      setShowActionModal(false);
      setSelectedBrand(null);
      fetchBrands();
      alert(`Brand ${actionType}d successfully!`);
    } catch (err) {
      console.error('Action failed:', err);
      alert('Action failed');
    }
  };

  const filteredBrands = brands.filter(b => {
    const matchesSearch = !searchTerm ||
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Brand Management</h1>
          <p className="text-slate-400">Manage all brands on the platform</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
              <Search className="absolute left-4 top-3 text-slate-500 pointer-events-none" size={20} />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Action Modal */}
        {showActionModal && selectedBrand && (
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
                {actionType === 'activate' ? 'Activate Brand' : 'Deactivate Brand'}
              </h2>
              <p className="text-slate-300 mb-6">
                Are you sure you want to {actionType} <span className="font-bold">{selectedBrand.name}</span>?
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
                    actionType === 'deactivate'
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
            <div className="p-8 text-center text-slate-400">Loading brands...</div>
          ) : filteredBrands.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No brands found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Brand</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Campaigns</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.map((brand) => (
                    <tr key={brand.id} className="border-b border-slate-700 hover:bg-slate-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={brand.logo || 'https://via.placeholder.com/40'}
                            alt={brand.name}
                            className="w-10 h-10 rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-slate-100">{brand.name}</p>
                            <p className="text-xs text-slate-400">{brand.industry}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{brand.email}</td>
                      <td className="px-6 py-4 text-slate-300">{brand.campaign_count || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          brand.status === 'active'
                            ? 'bg-green-900 text-green-100'
                            : brand.status === 'pending'
                            ? 'bg-yellow-900 text-yellow-100'
                            : 'bg-red-900 text-red-100'
                        }`}>
                          {brand.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedBrand(brand);
                              setActionType(brand.status === 'active' ? 'deactivate' : 'activate');
                              setShowActionModal(true);
                            }}
                            className="p-2 hover:bg-slate-600 rounded-lg transition cursor-pointer"
                            title={brand.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {brand.status === 'active' ? (
                              <XCircle size={18} className="text-red-400" />
                            ) : (
                              <CheckCircle size={18} className="text-green-400" />
                            )}
                          </button>
                          <button
                            className="p-2 hover:bg-slate-600 rounded-lg transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={18} className="text-blue-400" />
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
    </AdminLayout>
  );
}
