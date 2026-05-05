import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Target, Users, Zap, TrendingUp, BarChart2 } from 'lucide-react';
import { formatINR, formatCount } from '../../utils/format';
import { motion } from 'framer-motion';

export default function LeadManagement() {
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['brand-lead-management'],
    queryFn: () => api.get('/api/brand/lead-management').then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-32 bg-gray-100 rounded-3xl" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load lead management data. {error.message}
      </div>
    );
  }

  const stats = leads?.stats || {};
  const ranking = leads?.creator_ranking || [];
  const responseRates = leads?.response_rate_by_campaign || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-dm">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#EF4444] to-[#F97316] rounded-3xl p-8 text-white shadow-xl shadow-orange-100 flex items-center justify-between">
        <div className="space-y-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Target className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold font-jakarta">Lead Management</h1>
          <p className="text-orange-50 font-medium opacity-90 max-w-lg">
            Track creator response rates, performance rankings, and repeat collaboration rates. This is Gradix's key differentiator.
          </p>
        </div>
        <Zap className="w-24 h-24 text-white/10 hidden lg:block" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Response Rate"
          value={`${parseFloat(stats.response_rate || 0).toFixed(0)}%`}
          sub="Creator acceptance rate"
          type="gradient"
        />
        <StatCard
          label="Repeat Collab %"
          value={`${parseFloat(stats.repeat_collab_pct || 0).toFixed(0)}%`}
          sub="Creators rehired"
        />
        <StatCard
          label="Top Creator"
          value={stats.top_creator?.creator_name || '—'}
          sub={stats.top_creator ? `${parseFloat(stats.top_creator.engagement_rate || 0).toFixed(1)}% ER · ${formatINR(stats.top_creator.sales || 0)} sales` : 'No data yet'}
        />
        <StatCard
          label="Total Leads Generated"
          value={formatCount(stats.total_leads_generated || 0)}
          sub="From all campaigns"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Creator Performance Ranking */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Creator Performance Ranking
          </h2>
          {ranking.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No campaign data yet. Start collaborating with creators!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 tracking-widest uppercase border-b border-gray-50">
                    <th className="pb-4">Rank</th>
                    <th className="pb-4">Creator</th>
                    <th className="pb-4">ER</th>
                    <th className="pb-4">Sales</th>
                    <th className="pb-4">Repeat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ranking.map((creator, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <span className={`font-bold text-sm ${i < 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-gray-900 text-sm">{creator.creator_name}</td>
                      <td className="py-3 text-sm font-bold text-green-600">
                        {parseFloat(creator.engagement_rate || 0).toFixed(1)}%
                      </td>
                      <td className="py-3 text-sm font-bold text-gray-900">{formatINR(creator.sales || 0)}</td>
                      <td className="py-3">
                        <RepeatBadge type={creator.repeat} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Response Rate by Campaign */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Response Rate by Campaign
          </h2>
          {responseRates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No campaigns sent yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {responseRates.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-900 truncate max-w-[200px]">{item.campaign_title}</span>
                    <span className="font-extrabold text-blue-600 ml-2">
                      {parseFloat(item.response_rate_pct || 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(item.response_rate_pct || 0, 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, sub, type }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className={`p-6 rounded-3xl relative overflow-hidden ${
      type === 'gradient'
        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-100'
        : 'bg-white border border-gray-100 shadow-sm'
    }`}
  >
    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${type === 'gradient' ? 'text-blue-100' : 'text-gray-400'}`}>
      {label}
    </p>
    <h3 className="text-2xl font-extrabold mb-1 font-jakarta truncate">{value}</h3>
    <p className={`text-xs font-bold ${type === 'gradient' ? 'text-blue-50' : 'text-green-600'}`}>{sub}</p>
  </motion.div>
);

const RepeatBadge = ({ type }) => {
  const styles = {
    Yes: 'bg-green-100 text-green-700 border-green-200',
    No: 'bg-gray-100 text-gray-500 border-gray-200',
    Invite: 'bg-blue-50 text-blue-600 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[type] || styles.No}`}>
      {type || 'No'}
    </span>
  );
};
