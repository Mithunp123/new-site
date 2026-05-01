import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, Users, MousePointer, TrendingUp, Download, ChevronDown } from 'lucide-react';
import { getAnalytics } from '../api/creatorApi';
import StatCard from '../components/ui/StatCard';

const fmtK = (v) => v >= 100000 ? `${(v/100000).toFixed(2)}L` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : v;
const platformIcons = { instagram: '📸', youtube: '▶️', tiktok: '🎵', twitter: '🐦' };

export default function PerformanceAnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => getAnalytics({ period }).then(r => r.data)
  });

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse"></div>)}</div>
      </motion.div>
    );
  }

  const d = data || {};
  const maxViews = Math.max(...(d.platform_breakdown || []).map(p => p.views), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Performance Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Views, reach, clicks, sales generated & engagement across all platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Views" value={fmtK(d.total_views)} change={d.views_change_pct} changeLabel="this month" icon={Eye} variant="blue" index={0} />
        <StatCard label="Total Reach" value={fmtK(d.total_reach)} change={d.reach_change_pct} changeLabel="" icon={Users} index={1} />
        <StatCard label="Link Clicks" value={fmtK(d.total_clicks)} change={9} changeLabel={`CTR ${d.clicks_ctr}%`} icon={MousePointer} index={2} />
        <StatCard label="Avg Engagement Rate" value={`${d.avg_engagement_rate}%`} change={0.4} changeLabel="change" icon={TrendingUp} index={3} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left 2/3 */}
        <div className="col-span-2 space-y-6">
          {/* Platform Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold font-heading text-slate-900 mb-4">Platform Breakdown</h3>
            <div className="space-y-4">
              {(d.platform_breakdown || []).map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg">
                    {platformIcons[p.platform] || '📱'}
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-24 capitalize">{p.platform === 'twitter' ? 'Twitter/X' : p.platform}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(p.views / maxViews) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full gradient-blue rounded-full" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 font-heading w-20 text-right">{fmtK(p.views)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-base font-bold font-heading text-slate-900">Campaign Performance</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['Campaign', 'Views', 'Reach', 'Clicks', 'ER', 'Sales'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(d.campaign_performance || []).map((c, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700">{c.campaign_title}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{fmtK(c.views)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{fmtK(c.reach)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{fmtK(c.clicks)}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-green-600">{c.engagement_rate}%</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 font-heading">₹{c.sales_generated?.toLocaleString('en-IN')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel - Audience Demographics */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold font-heading text-slate-900 mb-4">Audience Demographics</h3>

            {/* Age breakdown */}
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Age Breakdown</p>
              {(d.audience_demographics?.age_groups || []).map((g, i) => (
                <div key={i} className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs font-medium text-slate-600 w-12">{g.range}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full gradient-blue rounded-full" style={{ width: `${g.percentage}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-10 text-right">{g.percentage}%</span>
                </div>
              ))}
            </div>

            {/* Top locations */}
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Top Locations</p>
              <div className="flex flex-wrap gap-2">
                {(d.audience_demographics?.top_locations || []).map((l, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600">
                    {l.city} {l.percentage}%
                  </span>
                ))}
              </div>
            </div>

            {/* Gender split */}
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Gender</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-blue-600 font-heading">{d.audience_demographics?.gender?.female_pct}%</p>
                  <p className="text-xs text-blue-600 font-medium">Female</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-slate-600 font-heading">{d.audience_demographics?.gender?.male_pct}%</p>
                  <p className="text-xs text-slate-500 font-medium">Male</p>
                </div>
              </div>
            </div>

            {/* Top performing niche */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Top Performing Niche</p>
              {(d.top_performing_niche || []).map((n, i) => (
                <div key={i} className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs font-medium text-slate-600 w-16">{n.niche}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full gradient-blue rounded-full" style={{ width: `${(n.engagement_rate / 10) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 w-10 text-right">{n.engagement_rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
