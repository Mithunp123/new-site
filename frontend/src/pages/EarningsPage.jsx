import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, Wallet, Clock, TrendingUp, Lock, Download, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getEarnings } from '../api/creatorApi';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';

const fmt = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

export default function EarningsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['earnings'], queryFn: () => getEarnings().then(r => r.data) });

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse"></div>)}</div>
      </motion.div>
    );
  }

  const d = data || {};
  const allTimeYTDPct = 22; // Static YTD

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Earnings Summary</h1>
          <p className="text-slate-500 text-sm mt-1">Your complete financial overview on Gradix</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition hover:scale-[1.02]">
          <Wallet size={16} /> Withdraw Earnings
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Earned (All Time)" value={fmt(d.total_earned_all_time)} change={allTimeYTDPct} changeLabel="YTD" icon={DollarSign} variant="blue" index={0} />
        <StatCard label="Available to Withdraw" value={fmt(d.available_to_withdraw)} changeLabel="Ready now" icon={Wallet} index={1} />
        <StatCard label="Pending Release" value={fmt(d.pending_release)} changeLabel={`In escrow — ${d.escrow_balance?.campaigns?.length || 0} campaigns`} icon={Clock} index={2} />
        <StatCard label="This Month" value={fmt(d.this_month)} change={d.change_pct} changeLabel="vs last month" icon={TrendingUp} index={3} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left 2/3 */}
        <div className="col-span-2 space-y-6">
          {/* Escrow Balance */}
          <div className="gradient-dark-blue rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={18} className="text-blue-300" />
              <h3 className="text-base font-bold font-heading">Escrow Balance</h3>
            </div>
            <p className="text-sm text-blue-200 mb-4">Funds secured by Gradix — released upon brand approval</p>
            <p className="text-3xl font-extrabold font-heading mb-1">{fmt(d.escrow_balance?.total)}</p>
            <p className="text-sm text-blue-200 mb-4">Across {d.escrow_balance?.campaigns?.length || 0} active campaigns</p>

            {(d.escrow_balance?.campaigns || []).map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 mb-2 backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="text-sm font-medium">{c.brand} — {fmt(c.amount)}</span>
                <span className="text-xs text-blue-200 ml-2">Pending approval</span>
                <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>
              </div>
            ))}

            <button className="mt-3 text-sm font-medium text-white border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 ml-auto">
              View Details <ArrowRight size={14} />
            </button>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-base font-bold font-heading text-slate-900">Transaction History</h2>
              <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                <Download size={14} /> Download PDF
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['Date', 'Brand', 'Campaign', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(d.transaction_history || []).map((t, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700">{t.brand_name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{t.campaign_title}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 font-heading">{fmt(t.amount)}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={t.payment_status === 'released' ? 'paid' : t.payment_status} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          {/* Withdraw card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold font-heading text-slate-900 mb-4">Withdraw Earnings</h3>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">Available Balance</p>
            <p className="text-3xl font-extrabold text-green-600 font-heading mb-4">{fmt(d.available_to_withdraw)}</p>

            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">Payout Method</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 mb-4">
              {d.payout_method || 'UPI — priya@paytm'}
            </div>

            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm">
              Withdraw {fmt(d.available_to_withdraw)}
            </button>
            <p className="text-xs text-slate-400 text-center mt-2">2-3 business days · No charges</p>
          </div>

          {/* Monthly Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold font-heading text-slate-900 mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={d.monthly_chart || []}>
                <defs>
                  <linearGradient id="earGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#93C5FD" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [fmt(v), 'Earnings']} />
                <Bar dataKey="total" fill="url(#earGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
