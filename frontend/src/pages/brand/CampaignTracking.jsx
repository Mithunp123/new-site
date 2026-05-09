import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { goLive } from '../../api/brandApi';
import { ExternalLink, Download, Search, AlertCircle, X, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatINR, formatCount } from '../../utils/format';
import { motion } from 'framer-motion';
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
  'revision_requested':  4,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-detail-tracking'] });
    },
  });

  const approveMut = useMutation({
    mutationFn: (id) => api.put(`/api/brand/campaign/${id}/approve-content`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-detail-tracking'] });
    },
  });

  const goLiveMut = useMutation({
    mutationFn: (id) => goLive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-detail-tracking'] });
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/api/brand/campaign/${id}/request-revision`, { revision_note: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-detail-tracking'] });
      setShowRejectInput(false);
      setRejectReason('');
    },
  });

  const featured = tracking?.featured_campaign;

  // Fetch full campaign detail to get content_submissions and negotiations
  const { data: featuredDetail } = useQuery({
    queryKey: ['campaign-detail-tracking', featured?.id],
    queryFn: async () => {
      const res = await api.get(`/api/campaign/${featured.id}`);
      return res.data.data;
    },
    enabled: !!featured?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const contentSubmissions = featuredDetail?.content_submissions || [];
  const negotiations       = featuredDetail?.negotiations || [];
  const previousRounds     = featuredDetail?.previous_rounds || [];

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

    if (status === 'revision_requested') return {
      msg: 'Revision requested. Waiting for creator to re-upload corrected content.',
      color: 'amber',
      isInfo: true,
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
          {featured.status !== 'campaign_closed' && (
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
          )}

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

          {/* Content submissions — per-platform diff view */}
          {contentSubmissions.filter(s => s.content_url).length > 0 && (
            <ContentSubmissionsPanel
              latest={contentSubmissions}
              previousRounds={previousRounds}
            />
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

// ─── Content Submissions Panel ───────────────────────────────────────────────
// Shows the latest submission round per platform with a clear UPDATED / SAME
// indicator when a revision round exists, so the brand can instantly see what
// the creator changed (or didn't change).

const PLATFORM_COLORS = {
  youtube:   { bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  instagram: { bg: 'bg-pink-50',   border: 'border-pink-100',   text: 'text-pink-700',   dot: 'bg-pink-500'   },
  twitter:   { bg: 'bg-sky-50',    border: 'border-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-500'    },
  tiktok:    { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  dot: 'bg-slate-500'  },
  linkedin:  { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  other:     { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
};

const ContentSubmissionsPanel = ({ latest, previousRounds }) => {
  const [showHistory, setShowHistory] = useState(false);
  const isRevision = previousRounds.length > 0;

  // Build a map: platform → previous URL (from the most recent previous round)
  const prevRound = isRevision ? previousRounds[0] : null;
  const prevByPlatform = {};
  if (prevRound) {
    prevRound.submissions.filter(s => s.content_url).forEach(s => {
      prevByPlatform[s.platform || 'other'] = s.content_url;
    });
  }

  // Group latest by platform
  const byPlatform = latest.filter(s => s.content_url).reduce((acc, s) => {
    const key = s.platform || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const submittedAt = latest[0]?.submitted_at
    ? new Date(latest[0].submitted_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <LottieIcon name="link" size={14} className="text-[#7C3AED]" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-600">Submitted Content</span>
          {isRevision && (
            <span className="text-[10px] font-bold text-white bg-[#7C3AED] px-2 py-0.5 rounded-full">
              Round {previousRounds.length + 1}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">{submittedAt}</span>
      </div>

      {/* Correction note from previous round */}
      {isRevision && prevRound?.rejection_note && (
        <div className="flex items-start gap-2.5 px-4 py-2.5 bg-orange-50 border-b border-orange-100">
          <AlertTriangle size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-800">
            <span className="font-semibold">Your correction note: </span>
            {prevRound.rejection_note}
          </p>
        </div>
      )}

      {/* Per-platform cards */}
      <div className="divide-y divide-slate-100">
        {Object.entries(byPlatform).map(([platform, subs]) => {
          const colors = PLATFORM_COLORS[platform] || PLATFORM_COLORS.other;
          const prevUrl = prevByPlatform[platform] || null;

          return subs.map((sub, idx) => {
            const isChanged = prevUrl && sub.content_url !== prevUrl;
            const isSame    = prevUrl && sub.content_url === prevUrl;

            return (
              <div key={sub.id || idx} className="px-4 py-3">
                {/* Platform label + change badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 capitalize">{platform}</span>
                  </div>
                  {isRevision && (
                    isChanged ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> UPDATED
                      </span>
                    ) : isSame ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} /> SAME LINK
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        NEW
                      </span>
                    )
                  )}
                </div>

                {/* New URL */}
                <a
                  href={sub.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-2 text-sm font-medium hover:underline break-all ${colors.text}`}
                >
                  <ExternalLink size={13} className="flex-shrink-0 mt-0.5" />
                  {sub.content_url}
                </a>

                {/* Previous URL shown below when it's a revision — so brand can compare */}
                {isRevision && prevUrl && (
                  <div className="mt-2 pl-5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      {isChanged ? 'Previous (replaced)' : 'Previous (unchanged)'}
                    </p>
                    <a
                      href={prevUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-1.5 text-xs text-slate-400 hover:text-slate-600 hover:underline break-all line-through decoration-slate-300"
                    >
                      <ExternalLink size={11} className="flex-shrink-0 mt-0.5" />
                      {prevUrl}
                    </a>
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>

      {/* Revision history toggle — older rounds */}
      {previousRounds.length > 1 && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={11} />
            {showHistory ? 'Hide' : 'Show'} full revision history ({previousRounds.length - 1} older {previousRounds.length - 1 === 1 ? 'round' : 'rounds'})
          </button>
          {showHistory && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
              {previousRounds.slice(1).map((round) => (
                <div key={round.round} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500">Round {round.round}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(round.submitted_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {round.rejection_note && (
                    <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-1 mb-2">
                      <span className="font-semibold">Correction: </span>{round.rejection_note}
                    </p>
                  )}
                  {round.submissions.filter(s => s.content_url).map((sub, idx) => (
                    <a key={sub.id || idx} href={sub.content_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:underline break-all mb-1">
                      <ExternalLink size={10} className="flex-shrink-0" />
                      {sub.content_url}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    brand_approved:      'badge-green',
    content_uploaded:    'badge-orange',
    revision_requested:  'badge-red',
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
    brand_approved: 'Approved', content_uploaded: 'In Review', revision_requested: 'Revision',
    request_sent: 'Brief Sent', creator_accepted: 'Accepted', agreement_locked: 'Active',
    negotiating: 'Negotiating', posted_live: 'Live', analytics_collected: 'Metrics In',
    escrow_released: 'Paid', campaign_closed: 'Closed', declined: 'Declined',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{labels[status] || 'Active'}</span>;
};

const EscrowBadge = ({ type, label }) => {
  const cls = { orange: 'badge-orange', blue: 'badge-blue', green: 'badge-green' };
  return <span className={`badge ${cls[type] || 'badge-gray'}`}>{label}</span>;
};

export default CampaignTracking;
