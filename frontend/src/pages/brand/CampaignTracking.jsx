import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { 
  Check, Clock, ExternalLink, Download, 
  Search, Filter, CheckCircle, AlertCircle,
  XCircle, ArrowRight, Lock, Upload, BarChart2, DollarSign, X
} from 'lucide-react';
import { formatINR, formatCount } from '../../utils/format';
import { motion } from 'framer-motion';
import { useCampaignSocket } from '../../hooks/useCampaignSocket';

const CampaignTracking = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const { data: tracking, isLoading } = useQuery({
    queryKey: ['campaign-tracking'],
    queryFn: async () => {
      const res = await api.get('/api/brand/campaigns/tracking');
      return res.data.data;
    }
  });

  const lockEscrowMutation = useMutation({
    mutationFn: (id) => api.post('/api/brand/payments/fund-escrow', { campaign_id: id }),
    onSuccess: () => queryClient.invalidateQueries(['campaign-tracking'])
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.put(`/api/brand/campaign/${id}/approve-content`),
    onSuccess: () => queryClient.invalidateQueries(['campaign-tracking'])
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/api/brand/campaign/${id}/request-revision`, { revision_note: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign-tracking']);
      setShowRejectInput(false);
      setRejectReason('');
    }
  });

  const markLiveMutation = useMutation({
    mutationFn: (id) => api.put(`/api/brand/campaign/${id}/mark-live`),
    onSuccess: () => queryClient.invalidateQueries(['campaign-tracking'])
  });

  const releasePaymentMutation = useMutation({
    mutationFn: (id) => api.put(`/api/brand/campaign/${id}/release-payment`),
    onSuccess: () => queryClient.invalidateQueries(['campaign-tracking'])
  });

  // Derive IDs for WebSocket before any early returns — empty array = no-op
  const featured = tracking?.featured_campaign;
  const allIds = (tracking?.all_campaigns || []).map(c => c.id).filter(Boolean);
  if (featured?.id) allIds.unshift(featured.id);
  useCampaignSocket([...new Set(allIds)]);

  if (isLoading) return <div className="p-8">Loading campaign progress...</div>;

  // Determine what action the brand needs to take based on current step
  const getActionBanner = (campaign) => {
    if (!campaign) return null;
    const step = campaign.progress_step ?? 0;
    const status = campaign.status;

    if (step === 1 || status === 'creator_accepted') {
      return {
        type: 'escrow',
        message: `${campaign.creator_name || 'Creator'} accepted your request! Lock escrow to proceed.`,
        action: () => lockEscrowMutation.mutate(campaign.id),
        actionLabel: '🔒 Lock Escrow',
        loading: lockEscrowMutation.isPending,
        color: 'blue'
      };
    }
    if (step === 3 || status === 'content_uploaded') {
      return {
        type: 'review',
        message: 'Creator has uploaded content. Review and approve or request revision.',
        action: () => approveMutation.mutate(campaign.id),
        actionLabel: '✓ Approve Content',
        loading: approveMutation.isPending,
        color: 'orange',
        secondaryAction: true
      };
    }
    if (step === 4 || status === 'brand_approved') {
      return {
        type: 'live',
        message: 'Content approved! Mark the campaign as live once the content is posted.',
        action: () => markLiveMutation.mutate(campaign.id),
        actionLabel: '🚀 Mark as Live',
        loading: markLiveMutation.isPending,
        color: 'green'
      };
    }
    if (step === 5 || status === 'posted_live') {
      return {
        type: 'waiting',
        message: 'Content is live! Collecting performance metrics automatically — this takes a few seconds.',
        action: null,
        actionLabel: null,
        loading: false,
        color: 'blue',
        isInfo: true
      };
    }
    if (step === 6 || status === 'analytics_collected') {
      return {
        type: 'payment',
        message: 'Metrics collected! Release payment to complete the campaign.',
        action: () => releasePaymentMutation.mutate(campaign.id),
        actionLabel: '💸 Release Payment',
        loading: releasePaymentMutation.isPending,
        color: 'green'
      };
    }
    if (step === 7 || status === 'escrow_released') {
      return {
        type: 'closing',
        message: 'Payment released! Campaign is being closed automatically.',
        action: null,
        actionLabel: null,
        loading: false,
        color: 'green',
        isInfo: true
      };
    }
    if (step === 8 || status === 'campaign_closed') {
      return {
        type: 'closed',
        message: '🎉 Campaign completed successfully! All steps done.',
        action: null,
        actionLabel: null,
        loading: false,
        color: 'green',
        isInfo: true
      };
    }
    return null;
  };

  const actionBanner = getActionBanner(featured);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-dm">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 font-jakarta">Campaign Progress</h1>
          <p className="text-gray-500 font-medium">Monitor all campaigns from request to payment</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all w-64"
            />
          </div>
          <button onClick={() => navigate('/brand/discover')} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            + Discover Creators
          </button>
        </div>
      </header>

      {/* Featured Campaign Progress */}
      {featured && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 font-jakarta">{featured.title} — Full Campaign Flow</h2>
            <StatusBadge status={featured.status} />
          </div>

          {/* Stepper */}
          <div className="relative flex justify-between items-center max-w-5xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-0" />
            {STEPS.map((step, i) => (
              <Step 
                key={i} 
                index={i} 
                label={step} 
                currentStep={featured.progress_step} 
              />
            ))}
          </div>

          {/* Dynamic Action Banner */}
          {actionBanner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 ${
                actionBanner.color === 'blue' ? 'bg-blue-50 border border-blue-200' :
                actionBanner.color === 'green' ? 'bg-green-50 border border-green-200' :
                'bg-[#FFFBEB] border border-[#FDE68A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  actionBanner.color === 'blue' ? 'bg-blue-100' :
                  actionBanner.color === 'green' ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <AlertCircle className={`w-6 h-6 ${
                    actionBanner.color === 'blue' ? 'text-blue-600' :
                    actionBanner.color === 'green' ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {actionBanner.message}
                </p>
              </div>
              {!actionBanner.isInfo && (
                <div className="flex gap-2 w-full md:w-auto flex-wrap">
                  <button
                    onClick={actionBanner.action}
                    disabled={actionBanner.loading}
                    className={`flex-1 md:flex-none px-6 py-2.5 font-bold rounded-xl transition-all text-sm disabled:opacity-60 ${
                      actionBanner.color === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                      actionBanner.color === 'green' ? 'bg-green-600 text-white hover:bg-green-700' :
                      'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {actionBanner.loading ? 'Processing...' : actionBanner.actionLabel}
                  </button>
                  {actionBanner.secondaryAction && (
                    <>
                      {showRejectInput ? (
                        <div className="flex gap-2 flex-1 md:flex-none">
                          <input
                            type="text"
                            placeholder="Reason for revision..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200 w-48"
                          />
                          <button
                            onClick={() => rejectMutation.mutate({ id: featured.id, reason: rejectReason })}
                            disabled={!rejectReason || rejectMutation.isPending}
                            className="px-4 py-2 bg-orange-500 text-white font-bold rounded-xl text-sm hover:bg-orange-600 disabled:opacity-50"
                          >
                            Send
                          </button>
                          <button onClick={() => setShowRejectInput(false)} className="p-2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRejectInput(true)}
                          className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                        >
                          Request Revision
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* All Campaigns Table */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 font-jakarta">All Campaigns</h2>
          <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 tracking-widest uppercase border-b border-gray-50">
                <th className="pb-4">Campaign</th>
                <th className="pb-4">Creators</th>
                <th className="pb-4">Content Links</th>
                <th className="pb-4">Spend</th>
                <th className="pb-4">Reach</th>
                <th className="pb-4">ROI</th>
                <th className="pb-4">Escrow</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tracking?.all_campaigns?.map((camp) => (
                <tr key={camp.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-4 font-bold text-gray-900">{camp.title}</td>
                  <td className="py-4 text-sm text-gray-600 font-medium">{camp.creators_count}</td>
                  <td className="py-4">
                    {camp.content_links_count > 0 ? (
                      <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        {camp.content_links_label}
                      </button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-4 font-bold text-gray-900">{formatINR(camp.spend)}</td>
                  <td className="py-4 font-bold text-gray-900">{camp.reach ? formatCount(camp.reach) : '—'}</td>
                  <td className={`py-4 font-bold ${camp.roi_percentage > 400 ? 'text-green-600' : (camp.roi_percentage > 200 ? 'text-orange-600' : 'text-gray-400')}`}>
                    {camp.roi}
                  </td>
                  <td className="py-4">
                    <EscrowBadge type={camp.escrow_badge_type} label={camp.escrow_label} />
                  </td>
                  <td className="py-4">
                    <StatusBadge status={camp.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const STEPS = [
  "Request Sent", "Creator Accepted", "Escrow Locked",
  "Content Uploaded", "Brand Approves", "Posted Live",
  "Metrics Collected", "Payment Released", "Campaign Closed"
];

const Step = ({ index, label, currentStep }) => {
  const isDone = index < currentStep;
  const isCurrent = index === currentStep;

  return (
    <div className="flex flex-col items-center gap-3 relative z-10 w-24">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
        isDone ? 'bg-green-500 border-green-500 text-white' : 
        isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 
        'bg-white border-gray-200 text-gray-300'
      }`}>
        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="text-xs font-bold">{index + 1}</span>}
      </div>
      <p className={`text-[10px] font-bold text-center leading-tight uppercase tracking-tighter ${
        isDone ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
      }`}>
        {label}
      </p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    'brand_approved': 'bg-green-100 text-green-700 border-green-200',
    'content_uploaded': 'bg-orange-100 text-orange-700 border-orange-200',
    'request_sent': 'bg-blue-100 text-blue-700 border-blue-200',
    'creator_accepted': 'bg-purple-100 text-purple-700 border-purple-200',
    'agreement_locked': 'bg-purple-100 text-purple-700 border-purple-200',
    'escrow_locked': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'posted_live': 'bg-green-100 text-green-700 border-green-200',
    'analytics_collected': 'bg-blue-100 text-blue-700 border-blue-200',
    'payment_released': 'bg-green-100 text-green-700 border-green-200',
    'escrow_released': 'bg-green-100 text-green-700 border-green-200',
    'campaign_closed': 'bg-gray-100 text-gray-600 border-gray-200',
    'declined': 'bg-red-100 text-red-600 border-red-200',
    'default': 'bg-gray-100 text-gray-700 border-gray-200'
  };
  const labels = {
    'brand_approved': 'Approved',
    'content_uploaded': 'In Review',
    'request_sent': 'Brief Sent',
    'creator_accepted': 'Accepted',
    'agreement_locked': 'Active',
    'escrow_locked': 'Escrow Locked',
    'posted_live': 'Live',
    'analytics_collected': 'Metrics In',
    'payment_released': 'Paid',
    'escrow_released': 'Payment Released',
    'campaign_closed': 'Closed',
    'declined': 'Declined'
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.default}`}>
      {labels[status] || 'Active'}
    </span>
  );
};

const EscrowBadge = ({ type, label }) => {
  const styles = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600'
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${styles[type] || 'bg-gray-50'}`}>
      {label}
    </span>
  );
};

export default CampaignTracking;
