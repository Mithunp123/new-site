import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Briefcase, Inbox, Eye, UserPlus, ArrowRight, Check, X, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboard, acceptCampaign, declineCampaign } from '../api/creatorApi';
import useAuthStore from '../store/authStore';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';

const fmt = (v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v || 0).toLocaleString('en-IN')}`;

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-100 rounded-lg" />
          <div className="h-4 w-40 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-80 bg-slate-100 rounded-2xl" />
        <div className="h-80 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then(r => r.data.data),
    refetchInterval: 60000,
  });

  const acceptMut = useMutation({
    mutationFn: (id) => acceptCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });

  const declineMut = useMutation({
    mutationFn: (id) => declineCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });

  if (isLoading) return <Skeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-2xl border border-red-100 p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 mb-4">
          <X size={22} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Failed to load dashboard</h2>
        <p className="text-sm text-slate-500 mb-5 max-w-sm">Check if the server is running and the database is configured correctly.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Creator';
  const d = data || {};

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good morning, {firstName} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with your brand deals today.</p>
        </div>
        <button className="btn-secondary self-start sm:self-center">
          <UserPlus size={15} /> Update Profile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Earnings This Month"  value={fmt(d.earnings_this_month?.amount)} change={d.earnings_this_month?.change_pct} changeLabel="vs last month" icon={Zap}      variant="blue" index={0} />
        <StatCard label="Active Campaigns"     value={d.active_campaigns?.count || 0}                                                  changeLabel="On track"      icon={Briefcase}              index={1} />
        <StatCard label="Pending Requests"     value={d.pending_requests?.count || d.new_requests?.length || 0}                        changeLabel="Respond in 48h" icon={Inbox}                  index={2} />
        <StatCard label="Profile Views (7d)"   value={d.creator?.profile_views || 0}                              change={8}           changeLabel="This week"     icon={Eye}                    index={3} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">

          {/* Active Campaigns */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase size={17} className="text-[#2563EB]" />
                <h2 className="text-base font-semibold text-slate-900">Active Campaigns</h2>
              </div>
              <a href="/campaigns" className="text-sm text-[#2563EB] font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Campaign</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.active_campaigns_list?.length > 0 ? (
                    d.active_campaigns_list.map((c, i) => (
                      <motion.tr key={c.campaign_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                              {c.brand_name?.[0]}
                            </div>
                            <span className="font-medium text-slate-900">{c.brand_name}</span>
                          </div>
                        </td>
                        <td>
                          <p className="font-medium text-slate-800">{c.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{c.deliverable}</p>
                        </td>
                        <td className="text-slate-500">
                          {c.deadline ? new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                        </td>
                        <td className="font-semibold text-slate-900">{fmt(c.amount)}</td>
                        <td><Badge status={c.status} /></td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                        No active campaigns. Check your requests to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={17} className="text-emerald-500" />
                  <h2 className="text-base font-semibold text-slate-900">Earnings Trend</h2>
                </div>
                <p className="text-sm text-slate-400">Monthly growth analysis</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-900">{fmt(d.ytd_earnings)}</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">↑ 22% YTD</p>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthly_earnings_chart || []} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#93C5FD" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} dy={8} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '10px 14px' }}
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Earnings']}
                  />
                  <Bar dataKey="total" fill="url(#barGrad)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">

          {/* New Requests */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Inbox size={17} className="text-amber-500" />
              <h3 className="text-base font-semibold text-slate-900">New Requests</h3>
            </div>
            <div className="space-y-3">
              {d.new_requests?.length > 0 ? (
                d.new_requests.map((r, i) => (
                  <motion.div
                    key={r.campaign_id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[#2563EB] text-sm">
                        {r.brand_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{r.brand_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{r.deliverable}</p>
                      </div>
                      <span className="text-sm font-bold text-[#2563EB]">₹{r.amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptMut.mutate(r.campaign_id)}
                        disabled={acceptMut.isPending}
                        className="flex-1 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Check size={13} /> Accept
                      </button>
                      <button
                        onClick={() => declineMut.mutate(r.campaign_id)}
                        disabled={declineMut.isPending}
                        className="flex-1 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <X size={13} /> Decline
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center py-8 text-sm text-slate-400">No new requests today</p>
              )}
            </div>
          </div>

          {/* Deadlines */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={17} className="text-red-500" />
              <h3 className="text-base font-semibold text-slate-900">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-3">
              {d.upcoming_deadlines?.length > 0 ? (
                d.upcoming_deadlines.map((dl, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                      dl.days_remaining <= 3 ? 'bg-red-500' :
                      dl.days_remaining <= 7 ? 'bg-amber-500' : 'bg-[#2563EB]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{dl.brand_name}</p>
                      <p className="text-xs text-slate-400 truncate">{dl.title}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${
                      dl.days_remaining <= 3 ? 'bg-red-50 text-red-600' :
                      dl.days_remaining <= 7 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {dl.days_remaining}d
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-sm text-slate-400">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
