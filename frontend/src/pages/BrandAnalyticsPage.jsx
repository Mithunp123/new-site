import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, MessageSquare, Share2 } from 'lucide-react';
import BrandLayout from '../components/layout/BrandLayout';
import * as brandApi from '../api/brandApi';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function BrandAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    campaigns: [],
    platformMetrics: [],
    timeSeriesData: [],
    topCreators: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await brandApi.getBrandAnalytics();
      setAnalytics({
        campaigns: res.data.campaigns || [],
        platformMetrics: res.data.platform_metrics || [],
        timeSeriesData: res.data.time_series || [],
        topCreators: res.data.top_creators || [],
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, change }) => (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <Icon size={18} className="text-blue-500" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {change !== undefined && (
        <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <BrandLayout>
        <div className="flex items-center justify-center h-96 text-slate-500">
          Loading analytics...
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Campaign Analytics</h1>
          <p className="text-slate-600">Track performance across all your campaigns</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Eye} title="Total Views" value="245.8K" change={12} />
          <StatCard icon={MessageSquare} title="Engagements" value="18.3K" change={8} />
          <StatCard icon={Share2} title="Shares" value="3.2K" change={-2} />
          <StatCard icon={TrendingUp} title="Conversion Rate" value="3.8%" change={1.5} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="engagements" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Platform Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance by Platform</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.platformMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="platform" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="views" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Campaign Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Campaign Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Campaign</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Creator</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Views</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Engagements</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">ER %</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Platform</th>
                </tr>
              </thead>
              <tbody>
                {analytics.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                      No campaigns with analytics data
                    </td>
                  </tr>
                ) : (
                  analytics.campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{campaign.title}</td>
                      <td className="px-6 py-4 text-slate-600">{campaign.creator_name}</td>
                      <td className="px-6 py-4 text-slate-900">{campaign.views?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-slate-900">{campaign.engagements?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 font-medium text-blue-600">
                        {campaign.engagement_rate?.toFixed(2) || 0}%
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm capitalize">
                          {campaign.platform}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </BrandLayout>
  );
}
