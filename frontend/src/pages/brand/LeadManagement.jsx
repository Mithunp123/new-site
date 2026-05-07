import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  Target, Users, TrendingUp, BarChart3,
  Repeat2, Zap, ArrowUpRight,
} from 'lucide-react';
import { formatINR, formatCount, safeFixed } from '../../utils/format';
import { motion } from 'framer-motion';

export default function LeadManagement() {
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['brand-lead-management'],
    queryFn: () => api.get('/api/brand/lead-management').then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-100 rounded-xl" />
            <div className="h-4 w-64 bg-slate-100 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-80 bg-slate-100 rounded-2xl" />
          <div className="h-80 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center">
        <Target size={36} className="text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Failed to load lead data</p>
        <p className="text-xs text-slate-400 mt-1">{error.message}</p>
      </div>
    );
  }

  const stats        = leads?.stats || {};
  const ranking      = leads?.creator_ranking || [];
  const responseRates = leads?.response_rate_by_campaign || [];

  const responseRate  = safeFixed(stats.response_rate, 0);
  const repeatPct     = safeFixed(stats.repeat_collab_pct, 0);
  const topCreator    = stats.top_creator;
  const totalLeads    = formatCount(stats.total_leads_generated || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Lead Management</h1>
          <p className="page-subtitle">
            Track creator response rates, performance rankings, and repeat collaboration rates.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Response Rate — blue accent */}
        <motion.div whileHover={{ y: -2 }} className="rounded-2xl p-5 bg-[#2563EB] text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">Response Rate</p>
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold">{responseRate}%</p>
          <p className="text-xs text-blue-200 mt-1.5 flex items-center gap-1">
            <ArrowUpRight size={12} />
            Creator acceptance rate
          </p>
        </motion.div>

        {/* Repeat Collab */}
        <motion.div whileHover={{ y: -2 }} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Repeat Collab %</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Repeat2 size={15} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{repeatPct}%</p>
          <p className="text-xs text-emerald-600 mt-1.5">Creators rehired</p>
        </motion.div>

        {/* Top Creator */}
        <motion.div whileHover={{ y: -2 }} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Top Creator</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Target size={15} className="text-amber-600" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 truncate">
            {topCreator?.creator_name || '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 truncate">
            {topCreator
              ? `${safeFixed(topCreator.engagement_rate, 1)}% ER · ${formatINR(topCreator.sales || 0)} sales`
              : 'No data yet'}
          </p>
        </motion.div>

        {/* Total Leads */}
        <motion.div whileHover={{ y: -2 }} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Leads</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 size={15} className="text-[#2563EB]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalLeads}</p>
          <p className="text-xs text-slate-400 mt-1.5">From all campaigns</p>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Creator Performance Ranking */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <Users size={17} className="text-[#2563EB]" />
            <h2 className="section-title">Creator Performance Ranking</h2>
          </div>

          {ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <BarChart3 size={36} className="text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No campaign data yet</p>
              <p className="text-xs text-slate-400 mt-1">Start collaborating with creators to see rankings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Creator</th>
                    <th>ER</th>
                    <th>Sales</th>
                    <th>Repeat</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((creator, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td>
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-amber-50 text-amber-600' :
                          i === 1 ? 'bg-slate-100 text-slate-600' :
                          i === 2 ? 'bg-orange-50 text-orange-600' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="font-semibold text-slate-900">{creator.creator_name}</td>
                      <td className="font-semibold text-emerald-600">
                        {safeFixed(creator.engagement_rate, 1)}%
                      </td>
                      <td className="font-semibold text-slate-900">{formatINR(creator.sales || 0)}</td>
                      <td><RepeatBadge type={creator.repeat} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Response Rate by Campaign */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={17} className="text-[#2563EB]" />
            <h2 className="section-title">Response Rate by Campaign</h2>
          </div>

          {responseRates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp size={36} className="text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No campaigns sent yet</p>
              <p className="text-xs text-slate-400 mt-1">Send requests to creators to track response rates</p>
            </div>
          ) : (
            <div className="space-y-5">
              {responseRates.map((item, i) => {
                const pct = Math.min(Number(item.response_rate_pct || 0), 100);
                const color = pct >= 70 ? '#10B981' : pct >= 40 ? '#2563EB' : '#F59E0B';
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
                        {item.campaign_title}
                      </span>
                      <span className="text-sm font-bold ml-3 flex-shrink-0" style={{ color }}>
                        {safeFixed(item.response_rate_pct, 0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{item.sent || 0} sent</span>
                      <span>{item.accepted || 0} accepted</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const RepeatBadge = ({ type }) => {
  const styles = {
    Yes:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    No:     'bg-slate-100 text-slate-500 border-slate-200',
    Invite: 'bg-blue-50 text-[#2563EB] border-blue-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${styles[type] || styles.No}`}>
      {type || 'No'}
    </span>
  );
};
