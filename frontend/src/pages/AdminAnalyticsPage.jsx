import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Building2, Zap, TrendingUp } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import * as adminApi from '../api/adminApi';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalCreators: 0,
    totalBrands: 0,
    activeCampaigns: 0,
    totalVolume: 0,
    topNiches: [],
    topPlatforms: [],
    monthlyTrend: [],
    commissionData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPlatformAnalytics();
      setAnalytics({
        totalCreators: res.data.total_creators || 0,
        totalBrands: res.data.total_brands || 0,
        activeCampaigns: res.data.active_campaigns || 0,
        totalVolume: res.data.total_volume || 0,
        topNiches: res.data.top_niches || [],
        topPlatforms: res.data.top_platforms || [],
        monthlyTrend: res.data.monthly_trend || [],
        commissionData: res.data.commission_data || [],
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-lg p-6 border border-slate-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-100">{value.toLocaleString()}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96 text-slate-400">
          Loading analytics...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Platform Analytics</h1>
          <p className="text-slate-400">Platform-wide metrics and insights</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Users} title="Total Creators" value={analytics.totalCreators} color="bg-blue-600" />
          <StatCard icon={Building2} title="Total Brands" value={analytics.totalBrands} color="bg-purple-600" />
          <StatCard icon={Zap} title="Active Campaigns" value={analytics.activeCampaigns} color="bg-amber-600" />
          <StatCard icon={TrendingUp} title="Total Volume" value={analytics.totalVolume} color="bg-green-600" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Monthly Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="campaigns" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Niches */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Top Niches</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topNiches}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="niche" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Platforms */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Top Platforms</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.topPlatforms}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.topPlatforms.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Commission Data */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Commission Collected</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.commissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
