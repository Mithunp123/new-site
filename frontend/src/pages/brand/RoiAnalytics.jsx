import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  Download, TrendingUp, DollarSign, Target, BarChart3,
  ArrowUpRight, ArrowDownRight, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatINR, formatCount, safeFixed } from '../../utils/format';
import { motion } from 'framer-motion';

const PERIOD_OPTIONS = [
  { value: '30d',     label: 'Last 30 Days' },
  { value: '90d',     label: 'Last 90 Days' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'all',     label: 'All Time' },
];

const RoiAnalytics = () => {
  const [period, setPeriod] = useState('quarter');

  const { data: roi, isLoading } = useQuery({
    queryKey: ['brand-roi-analytics', period],
    queryFn: async () => {
      const res = await api.get(`/api/brand/roi-analytics?period=${period}`);
      return res.data.data;
    },
  });

  const handleExport = () => {
    const rows = [
      ['Campaign', 'Spend', 'Reach', 'Clicks', 'Revenue', 'CPL', 'ROI'],
      ...(roi?.campaign_breakdown || []).map(c => [
        c.title, c.spend, c.reach, c.clicks, c.revenue, c.cpl, c.roi_x,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roi-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const totals = roi?.totals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign ROI Analytics</h1>
          <p className="page-subtitle">Total spend, revenue generated, cost per lead, and best performing creators</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/40 cursor-pointer"
          >
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="btn-primary"
          >
            <Download size={15} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="rounded-2xl p-5 bg-[#2563EB] text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200 mb-2">Total Spend</p>
          <p className="text-2xl font-bold">{formatINR(totals?.total_spend)}</p>
          <p className="text-xs text-blue-200 mt-1.5 flex items-center gap-1">
            <ArrowUpRight size={12} />
            {safeFixed(totals?.spend_change_pct)}% this quarter
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Revenue Generated</p>
          <p className="text-2xl font-bold text-emerald-600">{formatINR(totals?.revenue_generated)}</p>
          <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
            <ArrowUpRight size={12} />
            +{safeFixed(totals?.revenue_change_pct)}% vs last Q
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Avg Campaign ROI</p>
          <p className="text-2xl font-bold text-slate-900">{safeFixed(totals?.avg_campaign_roi, 1)}x</p>
          <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
            <ArrowUpRight size={12} />
            {totals?.roi_change || '0'} improvement
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Cost Per Lead</p>
          <p className="text-2xl font-bold text-slate-900">{formatINR(totals?.cost_per_lead)}</p>
          <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
            <ArrowDownRight size={12} />
            {safeFixed(totals?.cpl_change_pct)}% improved
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-[2] space-y-6">
          {/* Campaign Performance Breakdown */}
          <div className="card p-6">
            <h2 className="section-title mb-5">Campaign Performance Breakdown</h2>
            {!roi?.campaign_breakdown?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 size={36} className="text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No campaign data for this period</p>
                <p className="text-xs text-slate-400 mt-1">Try selecting a different date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Spend</th>
                      <th>Reach</th>
                      <th>Clicks</th>
                      <th>Revenue</th>
                      <th>CPL</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roi.campaign_breakdown.map((camp, i) => (
                      <tr key={i}>
                        <td className="font-semibold text-slate-900">{camp.title}</td>
                        <td>{formatINR(camp.spend)}</td>
                        <td>{formatCount(camp.reach)}</td>
                        <td>{formatCount(camp.clicks)}</td>
                        <td className="font-semibold text-emerald-600">{formatINR(camp.revenue)}</td>
                        <td>{formatINR(camp.cpl)}</td>
                        <td className={`font-bold ${
                          parseFloat(camp.roi_x) > 4 ? 'text-emerald-600' :
                          parseFloat(camp.roi_x) > 2 ? 'text-amber-600' : 'text-slate-400'
                        }`}>{camp.roi_x}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Best Performing Creators */}
          <div className="card p-6">
            <h2 className="section-title mb-5">Best Performing Creators</h2>
            {!roi?.best_performing_creators?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle size={36} className="text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No creator data for this period</p>
                <p className="text-xs text-slate-400 mt-1">Creator performance will appear once campaigns complete</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Creator</th>
                      <th>Reach</th>
                      <th>ER</th>
                      <th>Sales</th>
                      <th>Repeat?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roi.best_performing_creators.map((creator, i) => (
                      <tr key={i}>
                        <td>
                          <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center text-xs font-bold">
                            #{i + 1}
                          </span>
                        </td>
                        <td className="font-semibold text-slate-900">{creator.name}</td>
                        <td>{formatCount(creator.reach)}</td>
                        <td className="font-semibold text-emerald-600">{safeFixed(creator.engagement_rate)}%</td>
                        <td className="font-semibold text-slate-900">{formatINR(creator.sales_generated)}</td>
                        <td><RepeatBadge type={creator.repeat_collab} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-6">
          {/* ROI Chart */}
          <div className="card p-6">
            <h2 className="section-title mb-5">ROI by Campaign</h2>
            {!roi?.roi_by_campaign_chart?.length ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <BarChart3 size={32} className="text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">No chart data available</p>
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roi.roi_by_campaign_chart} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {roi.roi_by_campaign_chart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563EB' : '#DBEAFE'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="card p-6">
            <h2 className="section-title mb-5">Key Metrics</h2>
            <div className="space-y-3">
              <MetricRow label="Total Reach" value={formatCount(roi?.key_metrics?.total_reach)} />
              <MetricRow label="Total Engagement" value={formatCount(roi?.key_metrics?.total_engagement)} />
              <MetricRow label="Total Clicks" value={formatCount(roi?.key_metrics?.total_clicks)} />
              <MetricRow
                label="Repeat Collab %"
                value={`${safeFixed(roi?.key_metrics?.repeat_collab_pct, 0)}%`}
                valueColor="text-emerald-600"
              />
              <MetricRow
                label="Response Rate"
                value={`${safeFixed(roi?.key_metrics?.response_rate, 0)}%`}
                valueColor="text-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RepeatBadge = ({ type }) => {
  const styles = {
    'Yes':    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'No':     'bg-slate-100 text-slate-500 border-slate-200',
    'Invite': 'bg-blue-50 text-[#2563EB] border-blue-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${styles[type] || styles.No}`}>
      {type || 'No'}
    </span>
  );
};

const MetricRow = ({ label, value, valueColor }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className={`text-sm font-semibold text-slate-900 ${valueColor || ''}`}>{value || '—'}</span>
  </div>
);

export default RoiAnalytics;
