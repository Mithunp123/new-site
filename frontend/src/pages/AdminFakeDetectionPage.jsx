import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Flag, Trash2, Eye, TrendingDown } from 'lucide-react';
import * as adminApi from '../api/adminApi';

export default function AdminFakeDetectionPage() {
  const [suspiciousCreators, setSuspiciousCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchSuspiciousCreators();
  }, []);

  const fetchSuspiciousCreators = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSuspiciousCreators();
      setSuspiciousCreators(res.data.suspicious_creators || []);
    } catch (err) {
      console.error('Failed to fetch suspicious creators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedCreator) return;

    try {
      if (actionType === 'flag') {
        await adminApi.flagCreator(selectedCreator.id, { reason: 'Suspicious activity detected' });
      } else if (actionType === 'deactivate') {
        await adminApi.deactivateCreator(selectedCreator.id);
      }

      setShowActionModal(false);
      setSelectedCreator(null);
      fetchSuspiciousCreators();
      alert(`Creator ${actionType}d successfully!`);
    } catch (err) {
      console.error('Action failed:', err);
      alert('Action failed');
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 80) return 'bg-red-900 text-red-100';
    if (riskScore >= 60) return 'bg-orange-900 text-orange-100';
    return 'bg-yellow-900 text-yellow-100';
  };

  const getRiskLabel = (riskScore) => {
    if (riskScore >= 80) return 'High Risk';
    if (riskScore >= 60) return 'Medium Risk';
    return 'Low Risk';
  };

  const filteredCreators = suspiciousCreators.filter(c => {
    if (filterRisk === 'all') return true;
    if (filterRisk === 'high') return c.risk_score >= 80;
    if (filterRisk === 'medium') return c.risk_score >= 60 && c.risk_score < 80;
    return c.risk_score < 60;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Fake Account Detection</h1>
          <p className="text-slate-400">Monitor and manage suspicious creator accounts</p>
        </div>

        {/* Filter */}
        <div className="mb-6 max-w-sm">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk (80+)</option>
            <option value="medium">Medium Risk (60-79)</option>
            <option value="low">Low Risk (Below 60)</option>
          </select>
        </div>

        {/* Action Modal */}
        {showActionModal && selectedCreator && (
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
                {actionType === 'flag' ? 'Flag Creator' : 'Deactivate Creator'}
              </h2>
              <p className="text-slate-300 mb-6">
                Are you sure you want to {actionType} <span className="font-bold">{selectedCreator.name}</span>?
              </p>
              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold">Risk Score:</span> {selectedCreator.risk_score}%
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  <span className="font-semibold">Suspicious Indicators:</span> {selectedCreator.suspicious_indicators?.join(', ')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition text-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Suspicious Creators Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading suspicious creators...</div>
          ) : filteredCreators.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No suspicious creators found</div>
          ) : (
            filteredCreators.map((creator) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={creator.avatar || 'https://via.placeholder.com/60'}
                      alt={creator.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-100">{creator.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getRiskColor(creator.risk_score)}`}>
                          <AlertTriangle size={14} />
                          {getRiskLabel(creator.risk_score)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">@{creator.handle}</p>
                      <p className="text-sm text-slate-400">{creator.primary_platform} • {creator.followers?.toLocaleString()} followers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-400">{creator.risk_score}%</p>
                    <p className="text-xs text-slate-400">Risk Score</p>
                  </div>
                </div>

                {/* Suspicious Indicators */}
                <div className="mb-4 bg-slate-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Suspicious Indicators:</h4>
                  <div className="flex flex-wrap gap-2">
                    {creator.suspicious_indicators?.map((indicator, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-900 text-red-100 rounded-full text-xs flex items-center gap-1"
                      >
                        <TrendingDown size={12} />
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-700 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Engagement Rate</p>
                    <p className="text-lg font-bold text-slate-100">{creator.engagement_rate?.toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Follower Growth</p>
                    <p className="text-lg font-bold text-slate-100">{creator.follower_growth_rate?.toFixed(1)}%/mo</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Fake Followers</p>
                    <p className="text-lg font-bold text-slate-100">{creator.fake_followers_estimate}%</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Campaigns</p>
                    <p className="text-lg font-bold text-slate-100">{creator.campaign_count}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedCreator(creator);
                      setActionType('flag');
                      setShowActionModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Flag size={18} />
                    Flag Creator
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCreator(creator);
                      setActionType('deactivate');
                      setShowActionModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={18} />
                    Deactivate
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
  );
}
