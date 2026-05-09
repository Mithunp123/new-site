import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { formatCount, formatINR, getAvatarColor, getInitials } from '../../utils/format';
import {
  ArrowRight, BarChart3, Briefcase, CalendarClock,
  CircleAlert, Send, Sparkles, Target, TrendingUp, Users,
} from 'lucide-react';
import {
  Bar, CartesianGrid, Cell, ComposedChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import StatCard from '../../components/ui/StatCard';

const BrandDashboard = () => {
  const navigate = useNavigate();
  const userId = useAuthStore(state => state.user?.id);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['brand-dashboard', userId],
    queryFn: async () => {
      const res = await api.get('/api/brand/dashboard');
      return res.data.data;
    },
    enabled: !!userId,
  });

  if (isLoading) return <DashboardSkeleton />;

  const data               = dashboard ?? {};
  const activeCampaigns    = data.active_campaigns_list ?? [];
  const requests           = data.sent_requests ?? [];
  const spendSeries        = (data.monthly_spend_chart ?? []).map((entry, i, arr) => ({
    month: entry.month,
    spend: Number(entry.spend ?? 0),
    roi:   Number(entry.roi ?? 0),
    fill:  i === arr.length - 1 ? '#2563EB' : '#BFDBFE',
  }));
  const maxSpend           = Math.max(...spendSeries.map(e => e.spend), 1);

  const totalSpend         = Number(data.total_campaign_spend?.amount ?? 0) || 0;
  const spendChange        = Number(data.total_campaign_spend?.change_pct ?? 0) || 0;
  const activeCampaignCount = Number(data.active_campaigns?.count ?? 0) || 0;
  const pendingApproval    = Number(data.active_campaigns?.pending_approval ?? 0) || 0;
  const avgRoi             = Number(data.avg_campaign_roi?.value ?? 0) || 0;
  const roiChange          = Number(data.avg_campaign_roi?.change ?? 0) || 0;
  const creatorsHired      = Number(data.creators_hired?.count ?? 0) || 0;
  const campaignsCount     = Number(data.creators_hired?.across_campaigns ?? 0) || 0;
  const bestCreator        = data.performance_metrics?.best_creator;
  const bestCreatorName    = bestCreator?.name || 'No data yet';
  const bestCreatorEr      = Number(bestCreator?.er ?? 0) || 0;

  const insights = [
    pendingApproval > 0
      ? `${pendingApproval} creator approvals need attention.`
      : 'No creator approvals are waiting right now.',
    bestCreatorName !== 'No data yet'
      ? `${bestCreatorName} is your strongest creator at ${bestCreatorEr.toFixed(1)}% ER.`
      : 'Creator performance data will appear once campaigns gather engagement.',
    totalSpend > 0
      ? `You have allocated ${formatINR(totalSpend)} across brand activity so far.`
      : 'Campaign spend will appear as payments are recorded.',
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {data.brand_name || 'Brand'} 👋</h1>
          <p className="page-subtitle">A clear view of spend, creators, approvals, and ROI.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/brand/discover')} className="btn-primary-purple">
            <Sparkles size={15} /> Discover Creators
          </button>
          <button onClick={() => navigate('/brand/campaign-tracking')} className="btn-secondary">
            Track Campaigns
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Campaign Spend" value={formatINR(totalSpend)}          change={spendChange}  changeLabel="this month"          icon={BarChart3}  variant="purple" index={0} />
        <StatCard label="Active Campaigns"      value={String(activeCampaignCount)}   changeLabel={`${pendingApproval} pending approval`}      icon={Briefcase}  variant="blue"   index={1} />
        <StatCard label="Avg Campaign ROI"      value={`${avgRoi.toFixed(1)}x`}       change={roiChange}    changeLabel="vs last quarter"     icon={TrendingUp}  variant="green"  index={2} />
        <StatCard label="Creators Hired"        value={String(creatorsHired)}         changeLabel={`Across ${campaignsCount} campaigns`}       icon={Users}       variant="amber"  index={3} />
      </div>

      {/* Pending approval banner */}
      {pendingApproval > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3.5">
          <CalendarClock size={17} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 flex-1">
            {pendingApproval} creator approval{pendingApproval > 1 ? 's' : ''} need your attention.
          </p>
          <button onClick={() => navigate('/brand/campaign-tracking')} className="text-sm font-semibold text-amber-700 hover:underline flex items-center gap-1">
            Review <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">

        {/* Left */}
        <div className="space-y-5">

          {/* Spend vs ROI Chart */}
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={17} className="text-[#2563EB]" />
                  <h2 className="section-title">Monthly Spend vs ROI</h2>
                </div>
                <p className="text-sm text-slate-400">Spend bars and ROI trend on one timeline</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-right">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Avg ROI</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{avgRoi.toFixed(1)}x</p>
              </div>
            </div>

            <div className="h-72">
              {spendSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={spendSeries} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke="#F1F5F9" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }} dy={8} />
                    <YAxis yAxisId="spend" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={v => formatINR(v)} />
                    <YAxis yAxisId="roi" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={v => `${v.toFixed(0)}x`} />
                    <Tooltip
                      cursor={{ fill: 'rgba(37,99,235,0.04)' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      formatter={(value, name) => [name === 'spend' ? formatINR(Number(value)) : `${Number(value).toFixed(1)}x`, name === 'spend' ? 'Spend' : 'ROI']}
                    />
                    <Bar dataKey="spend" yAxisId="spend" radius={[6, 6, 2, 2]} barSize={28}>
                      {spendSeries.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                    <Line yAxisId="roi" type="monotone" dataKey="roi" stroke="#0F172A" strokeWidth={2.5} dot={{ r: 3.5, fill: '#0F172A', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                  Monthly campaign data will appear here once payments are recorded.
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              {[
                { label: 'Spend tracked',  value: formatINR(totalSpend),          icon: BarChart3 },
                { label: 'Campaigns live', value: String(activeCampaignCount),    icon: Briefcase },
                { label: 'Creators hired', value: String(creatorsHired),          icon: Users },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-base font-bold text-slate-900 mt-1">{s.value}</p>
                  </div>
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#2563EB] shadow-sm">
                    <s.icon size={15} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase size={17} className="text-[#2563EB]" />
                <h2 className="section-title">Active Campaigns</h2>
              </div>
              <button onClick={() => navigate('/brand/campaign-tracking')} className="text-sm text-[#2563EB] font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {activeCampaigns.length > 0 ? (
                activeCampaigns.map(campaign => (
                  <CampaignRow key={campaign.id} campaign={campaign} maxSpend={maxSpend} onOpen={() => navigate('/brand/campaign-tracking')} />
                ))
              ) : (
                <EmptyState icon={Sparkles} title="No active campaigns yet" description="Start by discovering creators and building your first campaign brief." actionLabel="Discover creators" onAction={() => navigate('/brand/discover')} />
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">

          {/* Sent Requests */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-[#2563EB]" />
                <h2 className="section-title">Sent Requests</h2>
              </div>
              <button onClick={() => navigate('/brand/requests')} className="text-sm text-[#2563EB] font-medium hover:underline">Open inbox</button>
            </div>
            <div className="divide-y divide-slate-50">
              {requests.length > 0 ? (
                requests.map((request, i) => <RequestRow key={`${request.creator_id}-${i}`} request={request} />)
              ) : (
                <EmptyState icon={Send} title="No sent requests" description="Requests you send to creators will appear here." actionLabel="Send a request" onAction={() => navigate('/brand/discover')} />
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-500" />
              <h2 className="section-title">Performance Snapshot</h2>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: 'Total Reach',       value: formatCount(data.performance_metrics?.total_reach) },
                { label: 'Total Engagement',  value: formatCount(data.performance_metrics?.total_engagement) },
                { label: 'Revenue Generated', value: formatINR(data.performance_metrics?.revenue_generated), color: 'text-emerald-600' },
                { label: 'Cost Per Lead',     value: formatINR(data.performance_metrics?.cost_per_lead) },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-500">{m.label}</span>
                  <span className={`text-sm font-semibold ${m.color || 'text-slate-900'}`}>{m.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-xl p-4 text-white mb-3">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Best Creator</p>
              <p className="text-base font-bold mt-2">{bestCreatorName}</p>
              <p className="text-sm text-slate-400 mt-0.5">Top engagement rate at {bestCreatorEr.toFixed(1)}% ER</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">What to do next</p>
              <ul className="space-y-2.5">
                {insights.map(insight => (
                  <li key={insight} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CircleAlert size={14} className="text-[#2563EB] mt-0.5 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Sub-components ─────────────────────────────── */

const CampaignRow = ({ campaign, maxSpend, onOpen }) => {
  const spend    = Number(campaign.spend ?? 0) || 0;
  const roi      = Number(campaign.roi ?? 0) || 0;
  const progress = Math.max(8, Math.min(100, (spend / maxSpend) * 100 || 0));
  const statusMeta = getCampaignStatusMeta(campaign.status);

  return (
    <div className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900">{campaign.title}</p>
            <span className={`badge ${statusMeta.badgeCls}`}>{statusMeta.label}</span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{Number(campaign.creators_count ?? 0)} creators onboarded</p>
        </div>
        <button onClick={onOpen} className="btn-ghost text-sm flex-shrink-0">
          View <ArrowRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Spend</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{formatINR(spend)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">ROI</p>
          <p className={`text-sm font-semibold mt-1 ${roi >= 4 ? 'text-emerald-600' : roi >= 2 ? 'text-amber-600' : 'text-slate-900'}`}>
            {roi ? `${roi.toFixed(1)}x` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Status</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{statusMeta.helper}</p>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

const RequestRow = ({ request }) => {
  const statusMeta = getRequestStatusMeta(request.request_status);
  const avatarText = request.creator_initials || getInitials(request.creator_name);

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: getAvatarColor(request.creator_id || 0) }}>
        {avatarText || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{request.creator_name}</p>
        <p className="text-xs text-slate-400 truncate">
          {request.status === 'negotiating' && request.negotiate_amount ? (
            <span className="text-amber-600 font-medium">{formatINR(request.negotiate_amount)}</span>
          ) : (
            formatINR(request.amount)
          )}
          {' · '}{request.campaign_title}
        </p>
      </div>
      <span className={`badge ${statusMeta.badgeCls} flex-shrink-0`}>{statusMeta.label}</span>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="p-10 text-center">
    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#2563EB] mx-auto mb-3">
      <Icon size={18} />
    </div>
    <p className="text-sm font-semibold text-slate-900">{title}</p>
    <p className="text-sm text-slate-400 mt-1 mb-4">{description}</p>
    <button onClick={onAction} className="btn-primary">
      {actionLabel} <ArrowRight size={14} />
    </button>
  </div>
);

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-5">
    <div className="flex justify-between items-center">
      <div className="space-y-2"><div className="h-7 w-56 bg-slate-100 rounded-lg" /><div className="h-4 w-40 bg-slate-100 rounded-lg" /></div>
      <div className="flex gap-2"><div className="h-9 w-32 bg-slate-100 rounded-xl" /><div className="h-9 w-32 bg-slate-100 rounded-xl" /></div>
    </div>
    <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}</div>
    <div className="grid grid-cols-[1fr_360px] gap-5">
      <div className="space-y-5"><div className="h-80 bg-slate-100 rounded-2xl" /><div className="h-64 bg-slate-100 rounded-2xl" /></div>
      <div className="space-y-5"><div className="h-64 bg-slate-100 rounded-2xl" /><div className="h-64 bg-slate-100 rounded-2xl" /></div>
    </div>
  </div>
);

const getCampaignStatusMeta = (status) => {
  const map = {
    active:           { label: 'Active',    badgeCls: 'badge-green',  helper: 'Running' },
    completed:        { label: 'Completed', badgeCls: 'badge-gray',   helper: 'Done' },
    paused:           { label: 'Paused',    badgeCls: 'badge-orange', helper: 'On hold' },
    draft:            { label: 'Draft',     badgeCls: 'badge-gray',   helper: 'Not started' },
    campaign_closed:  { label: 'Closed',    badgeCls: 'badge-gray',   helper: 'Closed' },
  };
  return map[status] || { label: status || 'Active', badgeCls: 'badge-blue', helper: 'In progress' };
};

const getRequestStatusMeta = (status) => {
  const map = {
    pending:      { label: 'Pending',  badgeCls: 'badge-orange' },
    accepted:     { label: 'Accepted', badgeCls: 'badge-green' },
    declined:     { label: 'Declined',    badgeCls: 'badge-red' },
    request_sent: { label: 'Sent',        badgeCls: 'badge-blue' },
    negotiating:  { label: 'Negotiating', badgeCls: 'badge-orange' },
  };
  return map[status?.toLowerCase()] || { label: status || 'Sent', badgeCls: 'badge-blue' };
};

export default BrandDashboard;
