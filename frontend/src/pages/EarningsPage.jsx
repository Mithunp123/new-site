import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, Wallet, Clock, TrendingUp, Lock, Download, ArrowRight, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getEarnings, withdrawEarnings } from '../api/creatorApi';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import useAuthStore from '../store/authStore';

const fmt = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

export default function EarningsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['earnings', user?.id],
    queryFn: () => getEarnings().then(r => r.data.data),
    staleTime: 0,
  });

  const withdrawMut = useMutation({
    mutationFn: (amount) => withdrawEarnings({ amount: Number(amount), payout_method: 'upi' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      setWithdrawSuccess(true);
      setWithdrawAmount('');
      setTimeout(() => setWithdrawSuccess(false), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}</div>
      </div>
    );
  }

  const d         = data || {};
  const available = d.available_to_withdraw || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Earnings</h1>
          <p className="page-subtitle">Your complete financial overview on Gradix</p>
        </div>
        <button className="btn-primary">
          <Wallet size={15} /> Withdraw Earnings
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Earned"         value={fmt(d.total_earned_all_time)} change={d.change_pct} changeLabel="vs last month" icon={DollarSign} variant="blue" index={0} />
        <StatCard label="Available to Withdraw" value={fmt(available)}              changeLabel="Ready now"                           icon={Wallet}                        index={1} />
        <StatCard label="Pending Release"       value={fmt(d.pending_release)}      changeLabel={`${d.escrow_balance?.campaigns?.length || 0} campaigns`} icon={Clock}   index={2} />
        <StatCard label="This Month"            value={fmt(d.this_month)}           change={d.change_pct} changeLabel="vs last month" icon={TrendingUp}                    index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Escrow Balance */}
          <div className="card p-6 bg-slate-900 border-slate-900 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={16} className="text-blue-300" />
              <h3 className="text-base font-semibold">Escrow Balance</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">Funds secured by Gradix — released upon brand approval</p>
            <p className="text-3xl font-bold mb-1">{fmt(d.escrow_balance?.total)}</p>
            <p className="text-sm text-slate-400 mb-4">Across {d.escrow_balance?.campaigns?.length || 0} active campaigns</p>

            <div className="space-y-2">
              {(d.escrow_balance?.campaigns || []).map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{c.brand} — {fmt(c.amount)}</span>
                  <span className="text-xs text-slate-400">Pending approval</span>
                </div>
              ))}
            </div>

            <button className="mt-4 btn-ghost text-white border border-white/20 hover:bg-white/10 text-sm">
              View Details <ArrowRight size={14} />
            </button>
          </div>

          {/* Transaction History */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="section-title">Transaction History</h2>
              <button className="btn-ghost text-sm">
                <Download size={14} /> Download PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Date', 'Brand', 'Campaign', 'Amount', 'Status'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(d.transaction_history || []).map((t, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td className="text-slate-500">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td className="font-medium text-slate-700">{t.brand_name}</td>
                      <td className="text-slate-600">{t.campaign_title}</td>
                      <td className="font-semibold text-slate-900">{fmt(t.amount)}</td>
                      <td><Badge status={t.payment_status === 'released' ? 'paid' : t.payment_status} /></td>
                    </motion.tr>
                  ))}
                  {!d.transaction_history?.length && (
                    <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">

          {/* Withdraw */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Withdraw Earnings</h3>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-emerald-600 mb-4">{fmt(available)}</p>

            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Payout Method</p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 mb-4">
              {(d.upi_id || user?.upi_id) ? `UPI — ${d.upi_id || user?.upi_id}` : 'UPI — Not Set (update in Settings)'}
            </div>

            {withdrawSuccess ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium mb-3">
                <CheckCircle size={15} /> Withdrawal requested! 2–3 business days.
              </div>
            ) : (
              <>
                <input
                  type="number"
                  placeholder={`Amount (max ${fmt(available)})`}
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  max={available}
                  className="input mb-3"
                />
                <button
                  onClick={() => withdrawMut.mutate(withdrawAmount)}
                  disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > available || withdrawMut.isPending || !d.upi_id}
                  className="btn-primary w-full justify-center"
                >
                  {withdrawMut.isPending ? 'Processing...' : `Withdraw ${withdrawAmount ? fmt(withdrawAmount) : ''}`}
                </button>
              </>
            )}
            <p className="text-xs text-slate-400 text-center mt-2">2–3 business days · No charges</p>
          </div>

          {/* Monthly Chart */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={d.monthly_chart || []}>
                <defs>
                  <linearGradient id="earGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#93C5FD" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [fmt(v), 'Earnings']}
                />
                <Bar dataKey="total" fill="url(#earGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
