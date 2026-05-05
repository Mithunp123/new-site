import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { getMyCampaigns } from '../api/creatorApi';
import Badge from '../components/ui/Badge';
import ProgressStepper from '../components/ui/ProgressStepper';

export default function MyCampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['myCampaigns'],
    queryFn: () => getMyCampaigns({}).then(r => r.data.data)
  });

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="h-64 bg-white rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-white rounded-2xl animate-pulse"></div>
      </motion.div>
    );
  }

  const d = data || {};
  const campaigns = d.campaigns || [];
  const featured = campaigns.length > 0 ? campaigns[0] : null;

  const progressPct = (step) => Math.round(((step + 1) / 9) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">My Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">All your active, completed, and upcoming collaborations</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{d.active_count} Active</span>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">{d.completed_count} Completed</span>
        </div>
      </div>

      {/* Featured Campaign Progress */}
      {featured && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 font-heading">
                {featured.brand_name?.[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-heading">{featured.brand_name} — {featured.title}</h3>
                <p className="text-xs text-slate-500">{featured.deliverable}</p>
              </div>
            </div>
            <Badge status={featured.status} />
          </div>

          <ProgressStepper currentStep={featured.progress_step} />

          <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100">
            {[
              { label: 'Brand', value: featured.brand_name },
              { label: 'Deliverable', value: featured.deliverable },
              { label: 'Campaign Amount', value: `₹${featured.campaign_amount?.toLocaleString('en-IN')}` },
              { label: 'Escrow Status', value: featured.escrow_status?.charAt(0).toUpperCase() + featured.escrow_status?.slice(1) },
              { label: 'Deadline', value: featured.deadline ? new Date(featured.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                <p className="text-sm font-bold text-slate-800 font-heading">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold font-heading text-slate-900">All Campaigns</h2>
          <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
            <Download size={14} /> Export
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {['Brand', 'Campaign', 'Deliverable', 'Amount', 'Escrow', 'Progress', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <motion.tr key={c.campaign_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">{c.brand_name?.[0]}</div>
                    <span className="text-sm font-medium text-slate-700">{c.brand_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{c.title}</td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{c.deliverable}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 font-heading">₹{c.campaign_amount?.toLocaleString('en-IN')}</td>
                <td className="px-5 py-3.5"><Badge status={c.escrow_status} /></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progressPct(c.progress_step)}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{progressPct(c.progress_step)}%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5"><Badge status={c.status} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
