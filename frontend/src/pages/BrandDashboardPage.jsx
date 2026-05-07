import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Zap, ChevronRight, ArrowRight } from 'lucide-react';
import BrandLayout from "../components/layout/BrandLayout";
import StatCard from "../components/ui/StatCard";
import * as brandApi from "../api/brandApi";

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
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
        className="mb-4"
      >
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Good morning, Brand! 👋</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Here's your brand overview for today</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Total Spend"
          value={`₹${dashboard?.total_spend_this_month.toLocaleString()}`}
          change={dashboard?.percentage_change}
          changeLabel="vs last month"
          icon={Zap}
          variant="blue"
          index={0}
        />
        <StatCard
          label="Active Campaigns"
          value={dashboard?.active_campaigns_count}
          changeLabel="On track"
          icon={Target}
          index={1}
        />
        <StatCard
          label="Leads Generated"
          value={dashboard?.total_leads_this_month}
          changeLabel="Total leads"
          icon={Users}
          index={2}
        />
        <StatCard
          label="Avg ROI"
          value={`${dashboard?.avg_roi_percentage}%`}
          changeLabel="Performance"
          icon={TrendingUp}
          index={3}
        />
      </div>

      {/* Active Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-premium overflow-hidden mb-4"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-50/50">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
             <Target size={20} className="text-brand-blue" strokeWidth={2.5} />
             Active Campaigns
          </h2>
          <button className="btn-primary flex items-center gap-2 text-xs">
            Send New Request
          </button>
        </div>

        {dashboard?.active_campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Campaign</th>
                  <th>Deliverable</th>
                  <th>Deadline</th>
                  <th>Budget</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.active_campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={campaign.creator_avatar || 'https://via.placeholder.com/40'}
                          alt={campaign.creator_name}
                          className="w-8 h-8 rounded-full border border-slate-100 shadow-sm"
                        />
                        <span className="font-bold text-slate-900">{campaign.creator_name}</span>
                      </div>
                    </td>
                    <td className="font-bold text-slate-800">{campaign.title}</td>
                    <td className="text-slate-400 font-bold text-[11px] uppercase tracking-tight">{campaign.deliverable}</td>
                    <td className="text-slate-500 font-bold">
                      {new Date(campaign.deadline).toLocaleDateString()}
                    </td>
                    <td className="font-black text-slate-900">₹{campaign.budget.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        campaign.status === 'posted_live'
                          ? 'badge-green'
                          : campaign.status === 'content_uploaded'
                          ? 'badge-blue'
                          : 'badge-orange'
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
          <div className="text-center py-12">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active campaigns yet</p>
          </div>
        )}
      </motion.div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Performing Creators */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card-premium p-5"
        >
          <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Users size={18} className="text-brand-blue" strokeWidth={2.5} />
            Top Performing Creators
          </h3>
          <div className="space-y-1">
            {dashboard?.top_performing_creators.map((creator, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-xl px-4 transition-colors">
                <div className="flex items-center gap-4">
                  <img
                    src={creator.avatar || 'https://via.placeholder.com/40'}
                    alt={creator.name}
                    className="w-10 h-10 rounded-full border border-slate-100"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{creator.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{creator.campaigns_done} campaigns done</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-blue text-lg leading-none">{creator.avg_er.toFixed(1)}%</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1">Eng. Rate</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-premium p-5"
        >
          <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Zap size={18} className="text-accent-red" strokeWidth={2.5} />
            Deadlines
          </h3>
          <div className="space-y-4">
            {dashboard?.upcoming_deadlines.map((deadline, idx) => (
              <div
                key={idx}
                className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
                <p className="font-bold text-slate-900 text-sm truncate">{deadline.campaign_title}</p>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">{deadline.creator_name}</p>
                <div className="flex items-center justify-between mt-3">
                   <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                    {deadline.days_remaining} days remaining
                  </p>
                  <ArrowRight size={12} className="text-rose-300" />
                </div>
              </div>
            ))}
            {dashboard?.upcoming_deadlines.length === 0 && (
              <p className="text-center py-8 text-slate-400 font-bold uppercase text-[10px]">All caught up!</p>
            )}
          </div>
        </motion.div>
      </div>
      </div>
    </BrandLayout>
  );
}
