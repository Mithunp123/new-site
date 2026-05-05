import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { 
  Target, Users, Zap, UserCheck, 
  TrendingUp, ArrowUpRight, Award,
  ChevronRight
} from 'lucide-react';
import { formatINR, formatCount } from '../../utils/format';
import { motion } from 'framer-motion';

const LeadManagement = () => {
  const { data: leads, isLoading } = useQuery({
    queryKey: ['brand-lead-management'],
    queryFn: async () => {
      const res = await api.get('/api/brand/lead-management');
      return res.data.data;
    }
  });

  if (isLoading) return <div className="p-8">Loading lead management data...</div>;

  const stats = leads?.stats;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-dm">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#EF4444] to-[#F97316] rounded-3xl p-8 text-white shadow-xl shadow-orange-100 flex items-center justify-between">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-jakarta">Lead Management — Brand View</h1>
            <p className="text-orange-50 font-medium opacity-90">Track creator response rates, rankings, and repeat collaboration rates.</p>
          </div>
        </div>
        <div className="hidden lg:block">
          <Zap className="w-24 h-24 text-white/10" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Response Rate" 
          value={`${(stats?.response_rate || 0).toFixed(0)}%`} 
          sub={`+${stats?.response_rate_change || 6}% this month`}
          type="gradient"
        />
        <StatCard 
          label="Repeat Collaboration %" 
          value={`${(stats?.repeat_collab_pct || 0).toFixed(0)}%`} 
          sub="Creators rehired"
        />
        <StatCard 
          label="Creator Performance Rank" 
          value={stats?.top_creator?.creator_name || '—'} 
          sub={`#1 · ${(stats?.top_creator?.engagement_rate || 0).toFixed(1)}% ER · ${formatINR(stats?.top_creator?.sales || 0)} sales`}
        />
        <StatCard 
          label="Total Leads Generated" 
          value={formatCount(stats?.total_leads_generated)} 
          sub={`+${stats?.leads_change_pct || 32}% this quarter`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Creator Performance Ranking */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6">Creator Performance Ranking</h2>
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
                {leads?.creator_ranking?.map((creator, i) => (
                  <tr key={i} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <span className={`font-bold ${i < 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-gray-900">{creator.creator_name}</td>
                    <td className="py-4 text-sm font-bold text-green-600">{(creator.engagement_rate || 0).toFixed(1)}%</td>
                    <td className="py-4 text-sm font-bold text-gray-900">{formatINR(creator.sales || 0)}</td>
                    <td className="py-4">
                      <RepeatBadge type={creator.repeat} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Response Rate by Campaign */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 font-jakarta mb-6">Response Rate by Campaign</h2>
          <div className="space-y-6">
            {leads?.response_rate_by_campaign?.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-900">{item.campaign_title}</span>
                  <span className="font-extrabold text-blue-600">{(item.response_rate_pct || 0).toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-gray-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.response_rate_pct}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, type }) => (
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
    <h3 className={`text-2xl font-extrabold mb-1 font-jakarta truncate`}>
      {value}
    </h3>
    <div className="flex items-center gap-1.5">
      <p className={`text-[11px] font-bold ${type === 'gradient' ? 'text-blue-50' : 'text-green-600'}`}>
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

export default LeadManagement;
