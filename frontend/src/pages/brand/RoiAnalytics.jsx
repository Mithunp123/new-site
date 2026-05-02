import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  TrendingUp, DollarSign, Target, PieChart, 
  Download, Calendar, ArrowUpRight, ArrowDownRight,
  UserCheck, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { formatINR, formatCount, formatROI } from '../../utils/format';
import { motion } from 'framer-motion';

const RoiAnalytics = () => {
  const { data: roi, isLoading } = useQuery({
    queryKey: ['brand-roi-analytics'],
    queryFn: async () => {
      const res = await axios.get('/api/brand/roi-analytics?period=quarter');
      return res.data.data;
    }
  });

  if (isLoading) return <div className="p-8">Loading ROI data...</div>;

  const totals = roi?.totals;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-dm">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 font-jakarta">Campaign ROI Analytics</h1>
          <p className="text-gray-500 font-medium">Total spend, revenue generated, cost per lead, and best performing creators</p>
        </div>
        <div className="flex gap-3">
          <select className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none">
            <option>Last 30 days</option>
            <option>Last Quarter</option>
            <option>All Time</option>
          </select>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Spend" 
          value={formatINR(totals?.total_spend)} 
          sub={`↑${totals?.spend_change_pct.toFixed(1)}% this quarter`}
          type="gradient"
        />
        <StatCard 
          label="Revenue Generated" 
          value={formatINR(totals?.revenue_generated)} 
          sub={`+${totals?.revenue_change_pct.toFixed(1)}% vs last Q`}
          valueColor="text-green-600"
        />
        <StatCard 
          label="Avg Campaign ROI" 
          value={totals?.avg_campaign_roi} 
          sub={`↑${totals?.roi_change}`}
        />
        <StatCard 
          label="Cost Per Lead" 
          value={formatINR(totals?.cost_per_lead)} 
          sub={`${totals?.cpl_change_pct.toFixed(1)}% improved`}
          isNegativeGood
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column (2/3) */}
        <div className="flex-[2] space-y-8">
          {/* Campaign Performance Breakdown */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6">Campaign Performance Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 tracking-widest uppercase border-b border-gray-50">
                    <th className="pb-4">Campaign</th>
                    <th className="pb-4">Spend</th>
                    <th className="pb-4">Reach</th>
                    <th className="pb-4">Clicks</th>
                    <th className="pb-4">Revenue</th>
                    <th className="pb-4">CPL</th>
                    <th className="pb-4">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {roi?.campaign_breakdown?.map((camp, i) => (
                    <tr key={i} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-bold text-gray-900">{camp.title}</td>
                      <td className="py-4 text-sm font-medium text-gray-600">{formatINR(camp.spend)}</td>
                      <td className="py-4 text-sm font-medium text-gray-600">{formatCount(camp.reach)}</td>
                      <td className="py-4 text-sm font-medium text-gray-600">{formatCount(camp.clicks)}</td>
                      <td className="py-4 text-sm font-bold text-green-600">{formatINR(camp.revenue)}</td>
                      <td className="py-4 text-sm font-medium text-gray-600">{formatINR(camp.cpl)}</td>
                      <td className={`py-4 text-sm font-bold ${parseFloat(camp.roi_x) > 4 ? 'text-green-600' : (parseFloat(camp.roi_x) > 2 ? 'text-orange-600' : 'text-gray-400')}`}>
                        {camp.roi_x}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Performing Creators */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6">Best Performing Creators</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 tracking-widest uppercase border-b border-gray-50">
                    <th className="pb-4">Rank</th>
                    <th className="pb-4">Creator</th>
                    <th className="pb-4">Reach</th>
                    <th className="pb-4">ER</th>
                    <th className="pb-4">Sales</th>
                    <th className="pb-4">Repeat?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {roi?.best_performing_creators?.map((creator, i) => (
                    <tr key={i} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                          #{i + 1}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-gray-900">{creator.name}</td>
                      <td className="py-4 text-sm font-medium text-gray-600">{formatCount(creator.reach)}</td>
                      <td className="py-4 text-sm font-bold text-green-600">{creator.engagement_rate.toFixed(1)}%</td>
                      <td className="py-4 text-sm font-bold text-gray-900">{formatINR(creator.sales_generated)}</td>
                      <td className="py-4">
                        <RepeatBadge type={creator.repeat_collab} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="flex-1 space-y-8">
          {/* ROI Chart */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6">ROI by Campaign</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roi?.roi_by_campaign_chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                    {roi?.roi_by_campaign_chart?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563EB' : '#DBEAFE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900 font-jakarta">Key Metrics</h2>
            <div className="space-y-4">
              <MetricRow label="Total Reach" value={formatCount(roi?.key_metrics?.total_reach)} />
              <MetricRow label="Total Engagement" value={formatCount(roi?.key_metrics?.total_engagement)} />
              <MetricRow label="Total Clicks" value={formatCount(roi?.key_metrics?.total_clicks)} />
              <MetricRow label="Repeat Collab %" value={`${roi?.key_metrics?.repeat_collab_pct.toFixed(0)}%`} valueColor="text-green-600" />
              <MetricRow label="Response Rate" value={`${roi?.key_metrics?.response_rate.toFixed(0)}%`} valueColor="text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, type, valueColor, isNegativeGood }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`p-6 rounded-3xl relative overflow-hidden ${
      type === 'gradient' 
        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-100' 
        : 'bg-white border border-gray-100 shadow-sm'
    }`}
  >
    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${type === 'gradient' ? 'text-blue-100' : 'text-gray-400'}`}>
      {label}
    </p>
    <h3 className={`text-3xl font-extrabold mb-1 font-jakarta ${valueColor || ''}`}>
      {value}
    </h3>
    <div className="flex items-center gap-1.5">
      <p className={`text-xs font-bold ${type === 'gradient' ? 'text-blue-50' : 'text-green-600'}`}>
        {sub}
      </p>
    </div>
  </motion.div>
);

const RepeatBadge = ({ type }) => {
  const styles = {
    'Yes': 'bg-green-100 text-green-700 border-green-200',
    'No': 'bg-gray-100 text-gray-500 border-gray-200',
    'Invite': 'bg-blue-50 text-blue-600 border-blue-200'
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[type] || styles.No}`}>
      {type}
    </span>
  );
};

const MetricRow = ({ label, value, valueColor }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <span className={`text-sm font-bold text-gray-900 ${valueColor || ''}`}>{value}</span>
  </div>
);

export default RoiAnalytics;
