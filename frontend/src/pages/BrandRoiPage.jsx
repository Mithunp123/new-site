import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Award, Target } from 'lucide-react';
import BrandLayout from '../components/layout/BrandLayout';
import * as brandApi from '../api/brandApi';

export default function BrandRoiPage() {
  const [roi, setRoi] = useState({
    totalInvested: 0,
    totalRevenue: 0,
    overallRoi: 0,
    campaigns: [],
    monthlyRoi: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoi();
  }, []);

  const fetchRoi = async () => {
    try {
      setLoading(true);
      const res = await brandApi.getBrandRoi();
      setRoi({
        totalInvested: res.data.total_invested || 0,
        totalRevenue: res.data.total_revenue || 0,
        overallRoi: res.data.overall_roi || 0,
        campaigns: res.data.campaigns || [],
        monthlyRoi: res.data.monthly_roi || [],
      });
    } catch (err) {
      console.error('Failed to fetch ROI:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <h3 className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </motion.div>
  );

  if (loading) {
    return (
      <BrandLayout>
        <div className="flex items-center justify-center h-96 text-slate-500">
          Loading ROI data...
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ROI Analysis</h1>
          <p className="text-slate-600">Understand your return on investment for each campaign</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            title="Total Invested"
            value={`₹${roi.totalInvested.toLocaleString()}`}
            subtitle="Across all campaigns"
            color="bg-blue-500"
          />
          <StatCard
            icon={TrendingUp}
            title="Total Revenue"
            value={`₹${roi.totalRevenue.toLocaleString()}`}
            subtitle="Generated from campaigns"
            color="bg-green-500"
          />
          <StatCard
            icon={Target}
            title="Overall ROI"
            value={`${roi.overallRoi.toFixed(1)}%`}
            subtitle="Average return rate"
            color="bg-purple-500"
          />
          <StatCard
            icon={Award}
            title="Best Performer"
            value={roi.campaigns && roi.campaigns[0]?.title || 'N/A'}
            subtitle="Highest ROI campaign"
            color="bg-amber-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly ROI Trend */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">ROI Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roi.monthlyRoi}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="roi" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Investment vs Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Investment vs Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roi.campaigns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="title" stroke="#64748b" angle={-45} height={80} />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar dataKey="investment" fill="#3b82f6" />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Campaign ROI Details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Campaign ROI Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Campaign</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Creator</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Investment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">ROI %</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {roi.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                      No campaigns found
                    </td>
                  </tr>
                ) : (
                  roi.campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{campaign.title}</td>
                      <td className="px-6 py-4 text-slate-600">{campaign.creator_name}</td>
                      <td className="px-6 py-4 text-slate-900">₹{campaign.investment.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-900">₹{campaign.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${campaign.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {campaign.roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          campaign.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
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
