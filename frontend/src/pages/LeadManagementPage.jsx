import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, TrendingUp, DollarSign, Award, BarChart2 } from 'lucide-react';
import { getLeads } from '../api/creatorApi';
import StatCard from '../components/ui/StatCard';

const nicheEmojis = {
  Beauty: '💄', Fashion: '👗', Food: '🍕', Tech: '💻',
  Lifestyle: '✨', Gaming: '🎮', Music: '🎵', Travel: '✈️',
  Fitness: '💪', Finance: '💰',
};

export default function LeadManagementPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: () => getLeads().then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl p-8 text-center text-red-600">
        Failed to load lead data: {error.message}
      </div>
    );
  }

  const d = data || {};
  const byCampaign = d.leads_by_campaign || [];
  const byNiche = d.leads_by_niche || [];
  const maxLeads = Math.max(...byCampaign.map(c => c.lead_count || 0), 1);
  const maxConv = Math.max(...byNiche.map(n => parseFloat(n.conversion_rate || 0)), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Banner */}
      <div className="gradient-dark-blue rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold font-heading">Lead Management</h1>
            <p className="text-sm text-blue-200 mt-0.5">
              Track leads generated through your campaigns — Gradix's key differentiator.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          label="Total Leads"
          value={d.total_leads || 0}
          change={22}
          changeLabel="this month"
          icon={Target}
          variant="blue"
          index={0}
        />
        <StatCard
          label="Conversion Rate"
          value={`${d.conversion_rate || '0.0'}%`}
          change={2.1}
          changeLabel="improved"
          icon={TrendingUp}
          index={1}
        />
        <StatCard
          label="Avg Deal Value"
          value={`₹${(d.avg_deal_value || 0).toLocaleString('en-IN')}`}
          change={8}
          changeLabel="avg"
          icon={DollarSign}
          index={2}
        />
        <StatCard
          label="Top Niche"
          value={d.top_performing_niche || '—'}
          changeLabel="Highest leads"
          icon={Award}
          index={3}
        />
      </div>

      {byCampaign.length === 0 && byNiche.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <BarChart2 size={40} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No leads yet</h3>
          <p className="text-slate-500 text-sm">
            Leads are generated automatically when your campaigns complete. Accept a collaboration to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads by Campaign */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold font-heading text-slate-900 mb-6">Leads by Campaign</h3>
            <div className="space-y-4">
              {byCampaign.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-sm font-medium text-slate-700 w-44 truncate">{c.campaign_title}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((c.lead_count || 0) / maxLeads) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 font-heading w-8 text-right">
                    {c.lead_count || 0}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Leads by Niche */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold font-heading text-slate-900 mb-6">Conversion by Niche</h3>
            <div className="space-y-4">
              {byNiche.map((n, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-lg w-8">{nicheEmojis[n.niche] || '📊'}</span>
                  <span className="text-sm font-medium text-slate-700 w-20">{n.niche}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(parseFloat(n.conversion_rate || 0) / maxConv) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                  </div>
                  <span className="text-sm font-semibold text-blue-600 font-heading w-14 text-right">
                    {parseFloat(n.conversion_rate || 0).toFixed(1)}%
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
