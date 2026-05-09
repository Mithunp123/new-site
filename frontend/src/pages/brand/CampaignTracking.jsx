import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { goLive } from '../../api/brandApi';
import { ExternalLink, Download, Search, AlertCircle, X } from 'lucide-react';
import { formatINR, formatCount } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaignSocket } from '../../hooks/useCampaignSocket';
import LottieIcon from '../../components/ui/LottieIcon';

// 7-step flow including negotiating
const STEPS = [
  'Request Sent',
  'Negotiating',
  'Creator Accepted',
  'Escrow Locked',
  'Content Uploaded',
  'Live',
  'Closed',
];

// Map DB status → stepper index
const STATUS_STEP = {
  'request_sent':        0,
  'negotiating':         1,
  'creator_accepted':    2,
  'agreement_locked':    3,
  'content_uploaded':    4,
  'brand_approved':      4,
  'posted_live':         5,
  'analytics_collected': 5,
  'escrow_released':     5,
  'campaign_closed':     6,
};

const CampaignTracking = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason]       = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const { data: tracking, isLoading } = useQuery({
    queryKey: ['campaign-tracking'],
    queryFn: async () => {
      const res = await api.get('/api/brand/campaigns/tracking');
      return res.data.data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const lockEscrowMut = useMutation({
    mutationFn: (id) => api.post('/api/brand/payments/fund-escrow', { campaign_id: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] }),
  });

  const approveMut = useMutation({
    mutationFn: (id) => api.put(`/api/brand/campaign/${id}/approve-content`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] }),
  });

  const goLiveMut = useMutation({
    mutationFn: (id) => goLive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/api/brand/campaign/${id}/request-revision`, { revision_note: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] });
      setShowRejectInput(false);
      setRejectReason('');
    },
  });

  const featured = tracking?.featured_campaign;

  // Fetch full campaign detail to get content_submissions and negotiations
  const { data: featuredDetail } = useQuery({
    queryKey: ['campaign-detail-tracking', featured?.id],
    queryFn: async () => {
      const res = await api.get(`/api/campaign/${featured.id}/detail`);
      return res.data.data;
    },
    enabled: !!featured?.id,
    staleTime: 0,
  });

  const contentSubmissions = featuredDetail?.content_submissions || [];
  const negotiations       = featuredDetail?.negotiations || [];

  // Group content submissions by platform
  const submissionsByPlatform = contentSubmissions.reduce((acc, sub) => {
    const key = sub.platform || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(sub);
    return acc;
  }, {});

  const allIds = (tracking?.all_campaigns || []).map(c => c.id).filter(Boolean);
  if (featured?.id) allIds.unshift(featured.id);
  useCampaignSocket([...new Set(allIds)]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 bg-slate-100 rounded-lg" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  const getActionBanner = (campaign) => {
    if (!campaign) return null;
    const status = campaign.status;

    if (status === 'negotiating') return {
      msg: 'Negotiation in progress. Review the latest offer below.',
      color: 'amber',
      isInfo: true,
    };

    if (status === 'creator_accepted') return {
      msg: `${campaign.creator_name || 'Creator'} accepted! Lock escrow to proceed.`,
      action: () => lockEscrowMut.mutate(campaign.id),
      label: 'Lock Escrow',
      loading: lockEscrowMut.isPending,
      color: 'blue',
    };

    if (status === 'content_uploaded') return {
      msg: 'Creator uploaded content. Review the links below, then approve or request corrections.',
      action: () => goLiveMut.mutate(campaign.id),
      label: 'Approve Content',
      loading: goLiveMut.isPending,
      color: 'amber',
      secondary: true,
    };

    if (status === 'brand_approved') return {
      msg: 'Content approved! Click "Go Live" to release payment and close the campaign.',
      action: () => goLiveMut.mutate(campaign.id),
      label: 'Go Live & Release Payment',
      loading: goLiveMut.isPending,
      color: 'green',
    };

    if (status === 'posted_live') return {
      msg: 'Campaign is live! Payment released and campaign is closing.',
      color: 'green',
      isInfo: true,
    };

    if (status === 'analytics_collected') return {
      msg: 'Metrics collected! Payment is being released automatically.',
      color: 'green',
      isInfo: true,
    };

    if (status === 'escrow_released') return {
      msg: 'Payment released! Campaign is closing.',
      color: 'green',
      isInfo: true,
    };

    if (status === 'campaign_closed') return {
      msg: 'Campaign completed! Metrics are permanently saved.',
      color: 'green',
      isInfo: true,
    };

    return null;
  };

  const actionBanner = getActionBanner(featured);

  const bannerColors = {
    blue:  'bg-blue-50 border-blue-100 text-blue-800',
    amber: 'bg-amber-50 border-amber-100 text-amber-800',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-800',
  };

  const featuredStep = STATUS_STEP[featured?.status] ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign Tracking</h1>
          <p className="page-subtitle">Monitor all campaigns from request to completion</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search campaigns..." className="w-56 py-2.5 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all" />
          </div>
          <button onClick={() => navigate('/brand/discover')} className="btn-primary">+ Discover Creators</button>
        </div>
      </div>

      {/* Featured Campaign */}
      {featured ? (
        <div className="card p-6 space-y-5">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{featured.title}</h2>
              <p className="text-sm text-slate-400 mt-0.5">with {featured.creator_name}</p>
            </div>
            <StatusBadge status={featured.status} />
          </div>

          {/* Stepper — 7 steps, numbered circles only */}
          <div className="relative flex justify-between items-start">
            <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 z-0" />
            {STEPS.map((step, i) => {
              const isDone    = i < featuredStep;
              const isCurrent = i === featuredStep;
              return (
                <div key={i} className="flex flex-col items-center gap-2 relative z-10" style={{ width: `${100 / STEPS.length}%` }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone    ? 'bg-[#7C3AED] border-[#7C3AED] text-white' :
                    isCurrent ? 'bg-white border-[#7C3AED] text-[#7C3AED] shadow-md shadow-purple-100' :
                    'bg-white border-slate-200 text-slate-400'
                  }`}>
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className={`text-[9px] font-semibold text-center leading-tight uppercase tracking-tight ${
                    isDone || isCurrent ? 'text-[#7C3AED]' : 'text-slate-400'
                  }`}>{step}</p>
                </div>
              );
            })}
          </div>

          {/* Negotiation history — shown when negotiating */}
          {featured.status === 'negotiating' && negotiations.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2">
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-2">Negotiation History</p>
              {negotiations.map((neg, idx) => (
                <div key={neg.id || idx} className={`rounded-lg p-3 text-sm border ${neg.proposed_by === 'brand' ? 'bg-white border-purple-100' : 'bg-white border-blue-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 capitalize">{neg.proposed_by}</span>
                    <span className="font-bold text-[#7C3AED]">₹{Number(neg.amount).toLocaleString('en-IN')}</span>
                  </div>
                  {neg.message && <p className="text-slate-500 text-xs">{neg.message}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Content submissions — grouped by platform */}
          {contentSubmissions.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <LottieIcon name="link" size={14} className="text-[#7C3AED]" />
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Submitted Content</p>
              </div>
              {Object.entries(submissionsByPlatform).map(([platform, subs]) => (
                <div key={platform} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 capitalize">{platform}</p>
                  {subs.map((sub, idx) => (
                    <a
                      key={sub.id || idx}
                      href={sub.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#7C3AED] font-medium hover:underline break-all mb-1"
                    >
                      <ExternalLink size={13} className="flex-shrink-0" />
                      {sub.content_url}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Action Banner */}
          {actionBanner && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${bannerColors[actionBanner.color] || bannerColors.blue}`}
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={17} className="flex-shrink-0" />
                <p className="text-sm font-medium">{actionBanner.msg}</p>
              </div>
              {!actionBanner.isInfo && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={actionBanner.action}
                    disabled={actionBanner.loading}
                    className="btn-primary"
                  >
                    {actionBanner.loading ? 'Processing...' : actionBanner.label}
                  </button>
                  {actionBanner.secondary && (
                    showRejectInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Correction note..."
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          className="input w-48 text-sm"
                        />
                        <button
                          onClick={() => rejectMut.mutate({ id: featured.id, reason: rejectReason })}
                          disabled={!rejectReason || rejectMut.isPending}
                          className="btn-secondary text-sm flex items-center gap-1"
                        >
                          <LottieIcon name="send" size={13} />
                          Send
                        </button>
                        <button onClick={() => setShowRejectInput(false)} className="btn-ghost p-2">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowRejectInput(true)} className="btn-secondary text-sm">
                        Request Corrections
                      </button>
                    )
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        <div className="card p-16 text-center border-dashed">
          <p className="text-base font-semibold text-slate-700">No active campaigns</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Send a collaboration request to get started.</p>
          <button onClick={() => navigate('/brand/discover')} className="btn-primary mx-auto">Discover Creators</button>
        </div>
      )}

      {/* All Campaigns Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="section-title">All Campaigns</h2>
          <button className="btn-ghost text-sm"><Download size={14} /> Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Campaign', 'Creator', 'Content', 'Spend', 'Views', 'Reach', 'Engagement', 'Escrow', 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tracking?.all_campaigns?.map(camp => (
                <tr key={camp.id}>
                  <td className="font-medium text-slate-900">{camp.title}</td>
                  <td>{camp.creators_count}</td>
                  <td>
                    {camp.content_links_count > 0 ? (
                      <span className="text-[#7C3AED] font-medium text-sm flex items-center gap-1">
                        <ExternalLink size={13} /> {camp.content_links_label}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="font-semibold text-slate-900">{formatINR(camp.spend)}</td>
                  <td>{camp.views ? formatCount(camp.views) : '—'}</td>
                  <td>{camp.reach ? formatCount(camp.reach) : '—'}</td>
                  <td className={camp.engagement_rate ? 'font-semibold text-emerald-600' : 'text-slate-300'}>
                    {camp.engagement_rate ? `${Number(camp.engagement_rate).toFixed(1)}%` : '—'}
                  </td>
                  <td><EscrowBadge type={camp.escrow_badge_type} label={camp.escrow_label} /></td>
                  <td><StatusBadge status={camp.status} /></td>
                </tr>
              ))}
              {!tracking?.all_campaigns?.length && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-sm">No campaigns yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    brand_approved:      'badge-green',
    content_uploaded:    'badge-orange',
    request_sent:        'badge-blue',
    creator_accepted:    'badge-purple',
    agreement_locked:    'badge-purple',
    negotiating:         'badge-orange',
    posted_live:         'badge-green',
    analytics_collected: 'badge-blue',
    escrow_released:     'badge-green',
    campaign_closed:     'badge-gray',
    declined:            'badge-red',
  };
  const labels = {
    brand_approved: 'Approved', content_uploaded: 'In Review', request_sent: 'Brief Sent',
    creator_accepted: 'Accepted', agreement_locked: 'Active', negotiating: 'Negotiating',
    posted_live: 'Live', analytics_collected: 'Metrics In',
    escrow_released: 'Paid', campaign_closed: 'Closed', declined: 'Declined',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{labels[status] || 'Active'}</span>;
};

const EscrowBadge = ({ type, label }) => {
  const cls = { orange: 'badge-orange', blue: 'badge-blue', green: 'badge-green' };
  return <span className={`badge ${cls[type] || 'badge-gray'}`}>{label}</span>;
};

export default CampaignTracking;
