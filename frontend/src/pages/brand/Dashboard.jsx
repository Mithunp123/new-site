import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { 
  Plus, Search, ArrowUpRight, TrendingUp, 
  Users, BarChart2, CheckCircle2, Clock 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { formatINR, formatCount, formatROI, getAvatarColor, getInitials } from '../../utils/format';
import { motion } from 'framer-motion';

const BrandDashboard = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['brand-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/brand/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-dm">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 font-jakarta">
            Welcome back, {dashboard?.brand_name} 👋
          </h1>
          <p className="text-gray-500 font-medium">Your influencer marketing command centre</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/brand/discover')} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Plus className="w-5 h-5" />
            Discover Creators
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Campaign Spend" 
          value={formatINR(dashboard?.total_campaign_spend?.amount)} 
          sub={`↑${(dashboard?.total_campaign_spend?.change_pct || 0).toFixed(1)}% this month`}
          type="gradient"
        />
        <StatCard 
          label="Active Campaigns" 
          value={dashboard?.active_campaigns?.count} 
          sub={`${dashboard?.active_campaigns?.pending_approval} pending approval`}
          subIcon={<div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
        />
        <StatCard 
          label="Avg Campaign ROI" 
          value={`${(dashboard?.avg_campaign_roi?.value || 0).toFixed(1)}x`} 
          sub={`↑${(dashboard?.avg_campaign_roi?.change || 0).toFixed(1)}x vs last quarter`}
          valueColor="text-green-600"
        />
        <StatCard 
          label="Creators Hired" 
          value={dashboard?.creators_hired?.count} 
          sub={`Across ${dashboard?.creators_hired?.across_campaigns} campaigns`}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="flex-1 space-y-8">
          {/* Active Campaigns Table */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-jakarta">Active Campaigns</h2>
              <button className="text-blue-600 font-bold text-sm hover:underline">View all →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 tracking-widest uppercase">
                    <th className="pb-4">Campaign</th>
                    <th className="pb-4">Creators</th>
                    <th className="pb-4">Spend</th>
                    <th className="pb-4">ROI</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dashboard?.active_campaigns_list?.map((camp) => (
                    <tr key={camp.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-bold text-gray-900">{camp.title}</td>
                      <td className="py-4 text-gray-600">{camp.creators_count}</td>
                      <td className="py-4 font-bold">{formatINR(camp.spend)}</td>
                      <td className={`py-4 font-bold ${camp.roi > 4 ? 'text-green-500' : (camp.roi > 2 ? 'text-orange-500' : 'text-gray-400')}`}>
                        {camp.roi ? `${Number(camp.roi).toFixed(1)}x` : '—'}
                      </td>
                      <td className="py-4">
                        <StatusBadge status={camp.status} />
                      </td>
                      <td className="py-4">
                        <button className="text-blue-600 font-bold hover:underline">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Spend vs ROI Chart */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6">Monthly Spend vs ROI</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard?.monthly_spend_chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F9FAFB' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="spend" radius={[6, 6, 0, 0]} barSize={32}>
                    {dashboard?.monthly_spend_chart?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === (dashboard?.monthly_spend_chart?.length || 0) - 1 ? '#2563EB' : '#DBEAFE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-[320px] space-y-8">
          {/* Sent Requests */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-jakarta">Sent Requests</h2>
              <button className="text-blue-600 font-bold text-sm hover:underline">View all</button>
            </div>
            <div className="space-y-4">
              {dashboard?.sent_requests?.map((req, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: getAvatarColor(req.creator_id) }}>
                    {req.creator_initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{req.creator_name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{formatINR(req.amount)} · {req.campaign_title}</p>
                  </div>
                  <RequestStatusBadge status={req.request_status} />
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6">Performance Metrics</h2>
            <div className="space-y-4">
              <MetricRow label="Total Reach" value={formatCount(dashboard?.performance_metrics?.total_reach)} />
              <MetricRow label="Total Engagement" value={formatCount(dashboard?.performance_metrics?.total_engagement)} />
              <MetricRow label="Revenue Generated" value={formatINR(dashboard?.performance_metrics?.revenue_generated)} valueColor="text-green-600" />
              <MetricRow label="Cost Per Lead" value={formatINR(dashboard?.performance_metrics?.cost_per_lead)} />
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Best Creator</p>
                <button className="text-sm font-bold text-blue-600 hover:underline">
                  {dashboard?.performance_metrics?.best_creator?.name || 'No data yet'} — {(dashboard?.performance_metrics?.best_creator?.er || 0).toFixed(1)}% ER
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, type, valueColor, subIcon }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`p-6 rounded-3xl relative overflow-hidden ${
      type === 'gradient' 
        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-100' 
        : 'bg-white border border-gray-100 shadow-sm'
    }`}
  >
    {type === 'gradient' && (
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-white opacity-10 rounded-full" />
    )}
    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${type === 'gradient' ? 'text-blue-100' : 'text-gray-400'}`}>
      {label}
    </p>
    <h3 className={`text-3xl font-extrabold mb-1 font-jakarta ${valueColor || ''}`}>
      {value}
    </h3>
    <div className="flex items-center gap-1.5">
      {subIcon}
      <p className={`text-xs font-bold ${type === 'gradient' ? 'text-blue-50' : 'text-green-600'}`}>
        {sub}
      </p>
    </div>
  </motion.div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    'brand_approved': 'bg-green-100 text-green-700 border-green-200',
    'content_uploaded': 'bg-orange-100 text-orange-700 border-orange-200',
    'request_sent': 'bg-blue-100 text-blue-700 border-blue-200',
    'default': 'bg-gray-100 text-gray-700 border-gray-200'
  };
  const labels = {
    'brand_approved': 'Active',
    'content_uploaded': 'In Review',
    'request_sent': 'Brief Sent'
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.default}`}>
      {labels[status] || 'Active'}
    </span>
  );
};

const RequestStatusBadge = ({ status }) => {
  const styles = {
    'Accepted': 'bg-green-50 text-green-600',
    'Pending': 'bg-orange-50 text-orange-600',
    'Sent': 'bg-blue-50 text-blue-600'
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${styles[status] || 'bg-gray-50'}`}>
      {status}
    </span>
  );
};

const MetricRow = ({ label, value, valueColor }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <span className={`text-sm font-bold text-gray-900 ${valueColor || ''}`}>{value}</span>
  </div>
);

export default BrandDashboard;
