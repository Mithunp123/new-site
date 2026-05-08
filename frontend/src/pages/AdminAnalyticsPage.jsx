import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, Building2, Zap, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import * as adminApi from '../api/adminApi';

// ── Premium colour palette ──────────────────────────────────────────────────
const PALETTE = {
  blue:   '#2563EB',
  indigo: '#6366F1',
  green:  '#10B981',
  amber:  '#F59E0B',
  red:    '#EF4444',
  purple: '#8B5CF6',
  cyan:   '#06B6D4',
};
const PIE_COLORS = [PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.red, PALETTE.purple];

// ── Custom Tooltip ──────────────────────────────────────────────────────────
const PremiumTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 min-w-[160px]">
      {label && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-xs text-slate-500 capitalize">{entry.name}</span>
          </div>
          <span className="text-sm font-bold text-slate-900">
            {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, title, value, change, changeLabel, gradient, index }) => {
  const isPositive = change === undefined || change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="card p-5 relative overflow-hidden"
    >
      {/* Subtle gradient blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 ${gradient}`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-10`}>
          <Icon size={20} className="text-white" />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change)}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-slate-400 font-medium">{title}</p>
      {changeLabel && <p className="text-[11px] text-slate-300 mt-0.5">{changeLabel}</p>}
    </motion.div>
  );
};

// ── Chart Card wrapper ──────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 + index * 0.08 }}
    className="card p-6"
  >
    <div className="mb-5">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);

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
      const data = res.data.data;
      setAnalytics({
        totalCreators:  data.total_creators       || 0,
        totalBrands:    data.total_brands         || 0,
        activeCampaigns:data.active_campaigns     || 0,
        totalVolume:    data.total_volume         || 0,
        topNiches:      data.top_niches           || [],
        topPlatforms:   data.platform_distribution|| [],
        monthlyTrend:   data.monthly_trend        || [],
        commissionData: data.commission_data      || [],
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-slate-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Analytics</h1>
          <p className="page-subtitle">Real-time metrics and platform-wide insights</p>
        </div>
        <button className="btn-secondary">Export Report</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      title="Total Creators"    value={analytics.totalCreators}   gradient="bg-blue-500"   index={0} />
        <StatCard icon={Building2}  title="Total Brands"      value={analytics.totalBrands}     gradient="bg-purple-500" index={1} />
        <StatCard icon={Zap}        title="Active Campaigns"  value={analytics.activeCampaigns} gradient="bg-amber-500"  index={2} />
        <StatCard icon={TrendingUp} title="Total Volume (₹)"  value={analytics.totalVolume}     gradient="bg-emerald-500" index={3} />
      </div>

      {/* Row 1 — Area chart + Niche bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Monthly Growth — Area */}
        <ChartCard title="Monthly Growth" subtitle="Campaigns & volume over time" index={0}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics.monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCampaigns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={PALETTE.blue}  stopOpacity={0.25} />
                  <stop offset="95%" stopColor={PALETTE.blue}  stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={PALETTE.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={PALETTE.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<PremiumTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Area type="monotone" dataKey="campaigns" stroke={PALETTE.blue}  strokeWidth={2.5} fill="url(#gradCampaigns)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="volume"    stroke={PALETTE.green} strokeWidth={2.5} fill="url(#gradVolume)"    dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Niches — Horizontal Bar */}
        <ChartCard title="Top Niches" subtitle="Creator distribution by category" index={1}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.topNiches} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradNiche" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor={PALETTE.blue}   stopOpacity={1} />
                  <stop offset="100%" stopColor={PALETTE.indigo} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="niche" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<PremiumTooltip />} />
              <Bar dataKey="count" fill="url(#gradNiche)" radius={[0, 6, 6, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 — Donut + Commission area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Platform Distribution — Donut */}
        <ChartCard title="Platform Distribution" subtitle="Share of creators per platform" index={2}>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={260}>
              <PieChart>
                <defs>
                  {PIE_COLORS.map((c, i) => (
                    <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={c} stopOpacity={1} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={analytics.topPlatforms}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                  stroke="none"
                >
                  {analytics.topPlatforms.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#pieGrad${index % PIE_COLORS.length})`} />
                  ))}
                </Pie>
                <Tooltip content={<PremiumTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex-1 space-y-2.5">
              {analytics.topPlatforms.map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-slate-600 capitalize">{entry.name || entry.platform}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{entry.count?.toLocaleString()}</span>
                </div>
              ))}
              {analytics.topPlatforms.length === 0 && (
                <p className="text-xs text-slate-400">No data available</p>
              )}
            </div>
          </div>
        </ChartCard>

        {/* Commission Collected — Gradient Bar */}
        <ChartCard title="Commission Collected" subtitle="Monthly revenue from platform fees" index={3}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.commissionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={PALETTE.green}  stopOpacity={1} />
                  <stop offset="100%" stopColor={PALETTE.cyan}   stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<PremiumTooltip prefix="₹" />} />
              <Bar dataKey="amount" fill="url(#gradCommission)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3 — Radial engagement + Line retention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Radial — Platform health scores */}
        <ChartCard title="Platform Health" subtitle="Key health indicators" index={4}>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="20%" outerRadius="90%"
              data={[
                { name: 'Verified',   value: 88, fill: PALETTE.green  },
                { name: 'Active',     value: 74, fill: PALETTE.blue   },
                { name: 'Retention',  value: 62, fill: PALETTE.purple },
                { name: 'Engagement', value: 51, fill: PALETTE.amber  },
              ]}
              startAngle={90} endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#F8FAFC' }} />
              <Tooltip content={<PremiumTooltip suffix="%" />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Line — Creator vs Brand growth */}
        <div className="lg:col-span-2">
          <ChartCard title="User Growth" subtitle="Creators vs Brands registered over time" index={5}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<PremiumTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Line type="monotone" dataKey="campaigns" stroke={PALETTE.blue}   strokeWidth={2.5} dot={{ r: 3, fill: PALETTE.blue,   strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="volume"    stroke={PALETTE.purple} strokeWidth={2.5} dot={{ r: 3, fill: PALETTE.purple, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

    </motion.div>
  );
}
