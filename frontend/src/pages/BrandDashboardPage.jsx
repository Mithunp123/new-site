import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Zap, ChevronRight } from 'lucide-react';
import BrandLayout from "../components/layout/BrandLayout";
import * as brandApi from "../api/brandApi";

const StatCard = ({ label, value, unit, change, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-xl p-6 text-white ${color}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium opacity-90">{label}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-3xl font-bold">{value}</p>
          <span className="text-sm opacity-75">{unit}</span>
        </div>
        {change && (
          <p className="text-sm mt-2 flex items-center gap-1">
            <TrendingUp size={14} />
            {change}% vs last month
          </p>
        )}
      </div>
      <Icon size={32} className="opacity-50" />
    </div>
  </motion.div>
);

export default function BrandDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await brandApi.getBrandDashboard();
        setDashboard(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <BrandLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500">Loading dashboard...</div>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-900">Good morning, Brand! 👋</h1>
        <p className="text-slate-600 mt-1">Here's your brand overview for today</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Spend This Month"
          value={`₹${dashboard?.total_spend_this_month.toLocaleString()}`}
          change={dashboard?.percentage_change}
          icon={Zap}
          color="bg-gradient-to-br from-blue-600 to-blue-700"
        />
        <StatCard
          label="Active Campaigns"
          value={dashboard?.active_campaigns_count}
          unit="campaigns"
          icon={Target}
          color="bg-gradient-to-br from-purple-600 to-purple-700"
        />
        <StatCard
          label="Leads Generated"
          value={dashboard?.total_leads_this_month}
          unit="leads"
          icon={Users}
          color="bg-gradient-to-br from-emerald-600 to-emerald-700"
        />
        <StatCard
          label="Avg ROI"
          value={dashboard?.avg_roi_percentage}
          unit="%"
          icon={TrendingUp}
          color="bg-gradient-to-br from-orange-600 to-orange-700"
        />
      </div>

      {/* Active Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Active Campaigns</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            Send New Request
          </button>
        </div>

        {dashboard?.active_campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Creator</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Campaign</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Deliverable</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Deadline</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Budget</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.active_campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={campaign.creator_avatar || 'https://via.placeholder.com/40'}
                          alt={campaign.creator_name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="font-medium text-slate-900">{campaign.creator_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{campaign.title}</td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{campaign.deliverable}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(campaign.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">₹{campaign.budget.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        campaign.status === 'posted_live'
                          ? 'bg-green-100 text-green-700'
                          : campaign.status === 'content_uploaded'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {campaign.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600">No active campaigns yet</p>
          </div>
        )}
      </motion.div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Performing Creators */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Performing Creators</h3>
          {dashboard?.top_performing_creators.map((creator, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <img
                  src={creator.avatar || 'https://via.placeholder.com/40'}
                  alt={creator.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-slate-900">{creator.name}</p>
                  <p className="text-sm text-slate-600">{creator.campaigns_done} campaigns</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{creator.avg_er.toFixed(1)}%</p>
                <p className="text-xs text-slate-600">Engagement Rate</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Deadlines</h3>
          {dashboard?.upcoming_deadlines.map((deadline, idx) => (
            <div
              key={idx}
              className="p-3 bg-orange-50 rounded-lg mb-3 last:mb-0 border border-orange-100"
            >
              <p className="font-medium text-slate-900 text-sm">{deadline.campaign_title}</p>
              <p className="text-xs text-slate-600 mt-1">{deadline.creator_name}</p>
              <p className="text-xs font-semibold text-orange-600 mt-2">
                {deadline.days_remaining} days remaining
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </BrandLayout>
  );
}
