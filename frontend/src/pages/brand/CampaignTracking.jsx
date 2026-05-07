import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Check, ExternalLink, Download, Search, AlertCircle, X, BarChart2 } from 'lucide-react';
import { formatINR, formatCount } from '../../utils/format';
import { motion } from 'framer-motion';
import { useCampaignSocket } from '../../hooks/useCampaignSocket';

const STEPS = [
  'Request Sent', 'Creator Accepted', 'Escrow Locked',
  'Content Uploaded', 'Brand Approves', 'Posted Live',
  'Metrics Collected', 'Payment Released', 'Campaign Closed',
];

const CampaignTracking = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason]     = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const { data: tracking, isLoading } = useQuery({
    queryKey: ['campaign-tracking'],
    queryFn: async () => {
      const res = await api.get('/api/brand/campaigns/tracking');
      return res.data.data;
    },
  });

  const lockEscrowMut    = useMutation({ mutationFn: (id) => api.post('/api/brand/payments/fund-escrow', { campaign_id: id }), onSuccess: () => queryClient.invalidateQueries(['campaign-tracking']) });
  const approveMut       = useMutation({ mutationFn: (id) => api.put(`/api/brand/campaign/${id}/approve-content`), onSuccess: () => queryClient.invalidateQueries(['campaign-tracking']) });
  const rejectMut        = useMutation({ mutationFn: ({ id, reason }) => api.put(`/api/brand/campaign/${id}/request-revision`, { revision_note: reason }), onSuccess: () => { queryClient.invalidateQueries(['campaign-tracking']); setShowRejectInput(false); setRejectReason(''); } });
  const markLiveMut      = useMutation({ mutationFn: (id) => api.put(`/api/brand/campaign/${id}/mark-live`), onSuccess: () => queryClient.invalidateQueries(['campaign-tracking']) });
  const releasePayMut    = useMutation({ mutationFn: (id) => api.put(`/api/brand/campaign/${id}/release-payment`), onSuccess: () => queryClient.invalidateQueries(['campaign-tracking']) });

  const featured = tracking?.featured_campaign;
  const allIds   = (tracking?.all_campaigns || []).map(c => c.id).filter(Boolean);
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
    const step   = campaign.progress_step ?? 0;
    const status = campaign.status;
    if (step === 1 || status === 'creator_accepted')    return { type: 'escrow',  msg: `${campaign.creator_name || 'Creator'} accepted! Lock escrow to proceed.`, action: () => lockEscrowMut.mutate(campaign.id), label: 'Lock Escrow', loading: lockEscrowMut.isPending, color: 'blue' };
    if (step === 3 || status === 'content_uploaded')    return { type: 'review',  msg: 'Creator uploaded content. Review and approve or request revision.', action: () => approveMut.mutate(campaign.id), label: 'Approve Content', loading: approveMut.isPending, color: 'amber', secondary: true };
    if (step === 4 || status === 'brand_approved')      return { type: 'live',    msg: 'Content approved! Mark as live once the content is posted.', action: () => markLiveMut.mutate(campaign.id), label: 'Mark as Live', loading: markLiveMut.isPending, color: 'green' };
    if (step === 5 || status === 'posted_live')         return { type: 'info',    msg: 'Content is live! Collecting performance metrics automatically.', color: 'blue', isInfo: true };
    if (step === 6 || status === 'analytics_collected') return { type: 'payment', msg: 'Metrics collected! Release payment to complete the campaign.', action: () => releasePayMut.mutate(campaign.id), label: 'Release Payment', loading: releasePayMut.isPending, color: 'green' };
    if (step === 7 || status === 'escrow_released')     return { type: 'info',    msg: 'Payment released! Campaign is being closed automatically.', color: 'green', isInfo: true };
    if (step === 8 || status === 'campaign_closed')     return { type: 'done',    msg: '🎉 Campaign completed successfully!', color: 'green', isInfo: true };
    return null;
  };

  const actionBanner = getActionBanner(featured);

  const bannerColors = {
    blue:  'bg-blue-50 border-blue-100 text-blue-800',
    amber: 'bg-amber-50 border-amber-100 text-amber-800',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-800',
  };

  const btnColors = {
    blue:  'btn-primary',
    amber: 'btn-primary',
    green: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-all inline-flex items-center gap-2',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign Tracking</h1>
          <p className="page-subtitle">Monitor all campaigns from request to payment</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search campaigns..." className="input pl-9 w-56" />
          </div>
          <button onClick={() => navigate('/brand/discover')} className="btn-primary">+ Discover Creators</button>
        </div>
      </div>

      {/* Featured Campaign */}
      {featured && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{featured.title}</h2>
              <p className="text-sm text-slate-400 mt-0.5">Full campaign flow</p>
            </div>
            <StatusBadge status={featured.status} />
          </div>

          {/* Stepper */}
          <div className="relative flex justify-between items-start mb-6">
            <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 z-0" />
            {STEPS.map((step, i) => {
              const isDone    = i < (featured.progress_step ?? 0);
              const isCurrent = i === (featured.progress_step ?? 0);
              return (
                <div key={i} className="flex flex-col items-center gap-2 relative z-10 w-20">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone    ? 'bg-emerald-500 border-emerald-500 text-white' :
                    isCurrent ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-md shadow-blue-200' :
                    'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <p className={`text-[9px] font-semibold text-center leading-tight uppercase tracking-tight ${
                    isDone ? 'text-emerald-600' : isCurrent ? 'text-[#2563EB]' : 'text-slate-400'
                  }`}>{step}</p>
                </div>
              );
            })}
          </div>

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
                  <button onClick={actionBanner.action} disabled={actionBanner.loading} className={btnColors[actionBanner.color] || btnColors.blue}>
                    {actionBanner.loading ? 'Processing...' : actionBanner.label}
                  </button>
                  {actionBanner.secondary && (
                    showRejectInput ? (
                      <div className="flex gap-2">
                        <input type="text" placeholder="Reason for revision..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input w-48 text-sm" />
                        <button onClick={() => rejectMut.mutate({ id: featured.id, reason: rejectReason })} disabled={!rejectReason || rejectMut.isPending} className="btn-secondary text-sm">Send</button>
                        <button onClick={() => setShowRejectInput(false)} className="btn-ghost p-2"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setShowRejectInput(true)} className="btn-secondary text-sm">Request Revision</button>
                    )
                  )}
                </div>
              )}
            </motion.div>
          )}
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
                {['Campaign', 'Creators', 'Content', 'Spend', 'Reach', 'ROI', 'Escrow', 'Status'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tracking?.all_campaigns?.map(camp => (
                <tr key={camp.id}>
                  <td className="font-medium text-slate-900">{camp.title}</td>
                  <td>{camp.creators_count}</td>
                  <td>
                    {camp.content_links_count > 0 ? (
                      <button className="text-[#2563EB] font-medium text-sm hover:underline flex items-center gap-1">
                        <ExternalLink size={13} /> {camp.content_links_label}
                      </button>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="font-semibold text-slate-900">{formatINR(camp.spend)}</td>
                  <td>{camp.reach ? formatCount(camp.reach) : '—'}</td>
                  <td className={`font-semibold ${camp.roi_percentage > 400 ? 'text-emerald-600' : camp.roi_percentage > 200 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {camp.roi}
                  </td>
                  <td><EscrowBadge type={camp.escrow_badge_type} label={camp.escrow_label} /></td>
                  <td><StatusBadge status={camp.status} /></td>
                </tr>
              ))}
              {!tracking?.all_campaigns?.length && (
                <tr><td colSpan={8} className="py-10 text-center text-slate-400 text-sm">No campaigns yet</td></tr>
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
    escrow_locked:       'badge-blue',
    posted_live:         'badge-green',
    analytics_collected: 'badge-blue',
    payment_released:    'badge-green',
    escrow_released:     'badge-green',
    campaign_closed:     'badge-gray',
    declined:            'badge-red',
  };
  const labels = {
    brand_approved: 'Approved', content_uploaded: 'In Review', request_sent: 'Brief Sent',
    creator_accepted: 'Accepted', agreement_locked: 'Active', escrow_locked: 'Escrow Locked',
    posted_live: 'Live', analytics_collected: 'Metrics In', payment_released: 'Paid',
    escrow_released: 'Released', campaign_closed: 'Closed', declined: 'Declined',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{labels[status] || 'Active'}</span>;
};

const EscrowBadge = ({ type, label }) => {
  const cls = { orange: 'badge-orange', blue: 'badge-blue', green: 'badge-green' };
  return <span className={`badge ${cls[type] || 'badge-gray'}`}>{label}</span>;
};

export default CampaignTracking;
