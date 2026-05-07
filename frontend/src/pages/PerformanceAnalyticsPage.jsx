import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, Users, MousePointer, TrendingUp, Download, ChevronDown } from 'lucide-react';
import { getAnalytics } from '../api/creatorApi';
import StatCard from '../components/ui/StatCard';

const fmtK = (v) => v >= 100000 ? `${(v / 100000).toFixed(2)}L` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v || 0);
const platformIcons = { instagram: '📸', youtube: '▶️', tiktok: '🎵', twitter: '🐦' };

export default function PerformanceAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => getAnalytics({ period }).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}</div>
      </div>
    );
  }

  const d       = data || {};
  const maxViews = Math.max(...(d.platform_breakdown || []).map(p => p.views), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">Views, reach, clicks, and engagement across all platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button className="btn-primary">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Views"         value={fmtK(d.total_views)}          change={d.views_change_pct}  changeLabel="this month"       icon={Eye}          variant="blue" index={0} />
        <StatCard label="Total Reach"         value={fmtK(d.total_reach)}          change={d.reach_change_pct}  changeLabel=""                 icon={Users}                       index={1} />
        <StatCard label="Link Clicks"         value={fmtK(d.total_clicks)}         change={9}                   changeLabel={`CTR ${d.clicks_ctr}%`} icon={MousePointer}            index={2} />
        <StatCard label="Avg Engagement Rate" value={`${d.avg_engagement_rate}%`}  change={0.4}                 changeLabel="change"           icon={TrendingUp}                  index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Platform Breakdown */}
          <div className="card p-6">
            <h3 className="section-title mb-5">Platform Breakdown</h3>
            <div className="space-y-4">
              {(d.platform_breakdown || []).map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                    {platformIcons[p.platform] || '📱'}
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-24 capitalize flex-shrink-0">
                    {p.platform === 'twitter' ? 'Twitter/X' : p.platform}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.views / maxViews) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full bg-[#2563EB] rounded-full"
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 w-16 text-right flex-shrink-0">{fmtK(p.views)}</span>
                </motion.div>
              ))}
              {!d.platform_breakdown?.length && (
                <p className="text-sm text-slate-400 text-center py-6">No platform data available</p>
              )}
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="section-title">Campaign Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Campaign', 'Views', 'Reach', 'Clicks', 'ER', 'Sales'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(d.campaign_performance || []).map((c, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td className="font-medium text-slate-700">{c.campaign_title}</td>
                      <td>{fmtK(c.views)}</td>
                      <td>{fmtK(c.reach)}</td>
                      <td>{fmtK(c.clicks)}</td>
                      <td className="font-semibold text-emerald-600">{c.engagement_rate}%</td>
                      <td className="font-semibold text-slate-900">₹{c.sales_generated?.toLocaleString('en-IN')}</td>
                    </motion.tr>
                  ))}
                  {!d.campaign_performance?.length && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No campaign data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right — Demographics */}
        <div className="card p-5">
          <h3 className="section-title mb-5">Audience Demographics</h3>

          {/* Age */}
          <div className="mb-5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">Age Breakdown</p>
            {(d.audience_demographics?.age_groups || []).map((g, i) => (
              <div key={i} className="flex items-center gap-3 mb-2.5">
                <span className="text-xs text-slate-500 w-12 flex-shrink-0">{g.range}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${g.percentage}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-8 text-right flex-shrink-0">{g.percentage}%</span>
              </div>
            ))}
          </div>

          {/* Locations */}
          <div className="mb-5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">Top Locations</p>
            <div className="flex flex-wrap gap-1.5">
              {(d.audience_demographics?.top_locations || []).map((l, i) => (
                <span key={i} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600">
                  {l.city} {l.percentage}%
                </span>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="mb-5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">Gender</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[#2563EB]">{d.audience_demographics?.gender?.female_pct}%</p>
                <p className="text-xs text-blue-600 font-medium">Female</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-600">{d.audience_demographics?.gender?.male_pct}%</p>
                <p className="text-xs text-slate-500 font-medium">Male</p>
              </div>
            </div>
          </div>

          {/* Top Niche */}
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">Top Performing Niche</p>
            {(d.top_performing_niche || []).map((n, i) => (
              <div key={i} className="flex items-center gap-3 mb-2.5">
                <span className="text-xs text-slate-500 w-16 flex-shrink-0">{n.niche}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${(n.engagement_rate / 10) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-[#2563EB] w-10 text-right flex-shrink-0">{n.engagement_rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
