import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Briefcase, Inbox, Eye, UserPlus, ArrowRight, Check, X, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboard, acceptCampaign, declineCampaign } from '../api/creatorApi';
import useAuthStore from '../store/authStore';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';

const formatCurrency = (v) => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v?.toLocaleString('en-IN') || 0}`;

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-48 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 shadow-sm"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 h-[400px] bg-white rounded-2xl border border-slate-100"></div>
      <div className="h-[400px] bg-white rounded-2xl border border-slate-100"></div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['dashboard'], 
    queryFn: () => getDashboard().then(r => r.data.data),
    refetchInterval: 60000 // Refetch every minute
  });

  const acceptMut = useMutation({
    mutationFn: (id) => acceptCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  });

  const declineMut = useMutation({
    mutationFn: (id) => declineCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-2xl border border-red-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
          <X size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to load dashboard</h2>
        <p className="text-slate-600 mb-6 max-w-md">There was an issue connecting to the database. Please check if the server is running and the database is configured correctly.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Creator';
  const d = data || {};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Good morning, {firstName} 👋</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Here's what's happening with your brand deals today.</p>
        </div>
        <button className="btn-primary flex items-center gap-2 self-start md:self-center py-2 text-xs">
          <UserPlus size={16} /> Update Profile
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Earnings This Month" 
          value={formatCurrency(d.earnings_this_month?.amount)} 
          change={d.earnings_this_month?.change_pct} 
          changeLabel="vs last month" 
          icon={Zap} 
          variant="blue" 
          index={0} 
        />
        <StatCard 
          label="Active Campaigns" 
          value={d.active_campaigns?.count || 0} 
          changeLabel="On track" 
          icon={Briefcase} 
          index={1} 
        />
        <StatCard 
          label="Pending Requests" 
          value={d.pending_requests?.count || d.new_requests?.length || 0} 
          changeLabel="Respond within 48 hrs" 
          icon={Inbox} 
          index={2} 
        />
        <StatCard 
          label="Profile Views (7d)" 
          value={d.creator?.profile_views || 0} 
          change={8} 
          changeLabel="Growth this week" 
          icon={Eye} 
          index={3} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Section: Campaigns and Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Campaigns Card */}
          <div className="card-premium overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-50/50">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Briefcase size={20} className="text-brand-blue" strokeWidth={2.5} />
                Active Campaigns
              </h2>
              <a href="/campaigns" className="text-xs text-brand-blue font-black hover:underline flex items-center gap-1 group uppercase tracking-wider">
                View all <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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
                      <motion.tr 
                        key={c.campaign_id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: i * 0.05 }}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                              {c.brand_name?.[0]}
                            </div>
                            <span className="font-bold text-slate-900">{c.brand_name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="font-bold text-slate-800">{c.title}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{c.deliverable}</div>
                        </td>
                        <td className="font-bold text-slate-500">
                          {c.deadline ? new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                        </td>
                        <td className="font-black text-slate-900">
                          {formatCurrency(c.amount)}
                        </td>
                        <td>
                          <Badge status={c.status} />
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No active campaigns found. Check your requests to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Earnings Chart Card */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <TrendingUp size={20} className="text-accent-green" strokeWidth={2.5} />
                  Earnings Trend
                </h2>
                <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-tight">Growth analysis</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(d.ytd_earnings)}</span>
                <p className="text-[10px] text-accent-green font-black flex items-center justify-end gap-1 uppercase">
                  <TrendingUp size={12} /> ↑22% YTD
                </p>
              </div>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthly_earnings_chart || []} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 800 }}
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 800, color: '#2563EB', fontSize: '12px' }}
                    labelStyle={{ fontWeight: 900, marginBottom: '4px', color: '#0F172A', fontSize: '11px', textTransform: 'uppercase' }}
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Earnings']}
                  />
                  <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Section: Sidebar Cards */}
        <div className="space-y-6">
          {/* New Requests Card */}
          <div className="card-premium p-6">
            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Inbox size={18} className="text-accent-orange" strokeWidth={2.5} />
              New Requests
            </h3>
            <div className="space-y-4">
              {d.new_requests?.length > 0 ? (
                d.new_requests.map((r, i) => (
                  <motion.div 
                    key={r.campaign_id} 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-brand-blue/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-brand-blue">
                        {r.brand_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{r.brand_name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{r.deliverable}</p>
                      </div>
                      <span className="text-sm font-black text-brand-blue">₹{r.amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => acceptMut.mutate(r.campaign_id)}
                        disabled={acceptMut.isLoading}
                        className="flex-1 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-brand-blue/20 disabled:opacity-50"
                      >
                        <Check size={14} strokeWidth={3} /> {acceptMut.isLoading ? '...' : 'Accept'}
                      </button>
                      <button 
                        onClick={() => declineMut.mutate(r.campaign_id)}
                        disabled={declineMut.isLoading}
                        className="flex-1 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <X size={14} strokeWidth={3} /> {declineMut.isLoading ? '...' : 'Decline'}
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-tight">
                  No new requests today
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines Card */}
          <div className="card-premium p-6">
            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Zap size={18} className="text-accent-red" strokeWidth={2.5} />
              Deadlines
            </h3>
            <div className="space-y-5">
              {d.upcoming_deadlines?.length > 0 ? (
                d.upcoming_deadlines.map((dl, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 relative pl-4"
                  >
                    <div className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full ${
                      dl.days_remaining <= 3 ? 'bg-accent-red' : 
                      dl.days_remaining <= 7 ? 'bg-accent-orange' : 
                      'bg-brand-blue'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{dl.brand_name}</p>
                      <p className="text-xs text-slate-400 font-bold line-clamp-1">{dl.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                        dl.days_remaining <= 3 ? 'bg-rose-50 text-rose-600' : 
                        dl.days_remaining <= 7 ? 'bg-orange-50 text-orange-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {dl.days_remaining}d left
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-tight">
                  No upcoming deadlines
                </div>
              )}
            </div>
            <button className="w-full mt-6 py-2.5 border-2 border-dashed border-slate-100 text-slate-400 hover:text-brand-blue hover:border-brand-blue/30 hover:bg-brand-blue/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
               Calendar View <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>

  );
}
