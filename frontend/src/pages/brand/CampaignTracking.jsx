import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { 
  Check, Clock, ExternalLink, Download, 
  Search, Filter, CheckCircle, AlertCircle,
  XCircle, ArrowRight
} from 'lucide-react';
import { formatINR, formatCount } from '../../utils/format';
import { motion } from 'framer-motion';

const CampaignTracking = () => {
  const queryClient = useQueryClient();
  const { data: tracking, isLoading } = useQuery({
    queryKey: ['campaign-tracking'],
    queryFn: async () => {
      const res = await api.get('/api/brand/campaigns/tracking');
      return res.data.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.put(`/api/brand/campaign/${id}/approve-content`),
    onSuccess: () => queryClient.invalidateQueries(['campaign-tracking'])
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/api/brand/campaign/${id}/reject-content`, { reason }),
    onSuccess: () => queryClient.invalidateQueries(['campaign-tracking'])
  });

  if (isLoading) return <div className="p-8">Loading campaign progress...</div>;

  const featured = tracking?.featured_campaign;

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
          <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            + New Campaign
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

          {/* Action Banner */}
          {featured.action_required && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  📋 {featured.action_required.message}
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => approveMutation.mutate(featured.id)}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm"
                >
                  ✓ Approve Content
                </button>
                <button 
                  onClick={() => {
                    const reason = prompt('Enter rejection reason:');
                    if (reason) rejectMutation.mutate({ id: featured.id, reason });
                  }}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  Request Revision
                </button>
              </div>
            </div>
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
    'campaign_closed': 'bg-gray-100 text-gray-700 border-gray-200',
    'default': 'bg-gray-100 text-gray-700 border-gray-200'
  };
  const labels = {
    'brand_approved': 'Completed',
    'content_uploaded': 'In Review',
    'request_sent': 'Brief Sent',
    'campaign_closed': 'Closed'
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
