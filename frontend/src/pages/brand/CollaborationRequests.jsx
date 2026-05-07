import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Clock, CheckCircle2, XCircle, Send, ArrowUpRight } from 'lucide-react';
import { formatINR } from '../../utils/format';
import { motion } from 'framer-motion';

const COLLABED_STATUSES = [
  'creator_accepted', 'agreement_locked', 'escrow_locked',
  'content_uploaded', 'brand_approved', 'posted_live',
  'analytics_collected', 'payment_released', 'escrow_released', 'campaign_closed',
];

const CollaborationRequests = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['brand-requests'],
    queryFn: async () => {
      const res = await api.get('/api/brand/collaboration/requests');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}</div>
        <div className="h-80 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    if (COLLABED_STATUSES.includes(status?.toLowerCase())) {
      return <span className="badge badge-purple"><CheckCircle2 className="w-3 h-3" /> Collabed</span>;
    }
    switch (status?.toLowerCase()) {
      case 'accepted':     return <span className="badge badge-green"><CheckCircle2 className="w-3 h-3" /> Accepted</span>;
      case 'declined':     return <span className="badge badge-red"><XCircle className="w-3 h-3" /> Declined</span>;
      case 'pending':      return <span className="badge badge-orange"><Clock className="w-3 h-3" /> Pending</span>;
      default:             return <span className="badge badge-blue"><Send className="w-3 h-3" /> Sent</span>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Collaboration Requests</h1>
          <p className="page-subtitle">Manage your sent proposals and track creator responses</p>
        </div>
        <button onClick={() => navigate('/brand/discover')} className="btn-primary">
          <Send size={15} /> Send New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Sent Requests',    value: data?.sent_count || 0,                                          icon: Send,         cls: 'text-[#2563EB]', bg: 'bg-blue-50' },
          { label: 'Pending Approval', value: data?.pending_count || 0,                                       icon: Clock,        cls: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Collabs',   value: (data?.accepted_count || 0) + (data?.collabed_count || 0),      icon: CheckCircle2, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                <card.icon size={17} className={card.cls} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Requests Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="section-title">All Requests</h2>
        </div>

        {data?.requests?.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-base font-semibold text-slate-900">No requests sent yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Head over to the discovery page to find creators.</p>
            <button onClick={() => navigate('/brand/discover')} className="btn-primary">Discover Creators</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Campaign</th>
                  <th>Offer</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.requests?.map(req => (
                  <motion.tr key={req.campaign_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: req.avatar_color || '#2563EB' }}>
                          {req.creator_initials || 'CR'}
                        </div>
                        <span className="font-medium text-slate-900">{req.creator_name}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">{req.campaign_title}</td>
                    <td className="font-semibold text-slate-900">{formatINR(req.amount)}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td className="text-right">
                      {COLLABED_STATUSES.includes(req.status?.toLowerCase()) ? (
                        <button onClick={() => navigate('/brand/campaign-tracking')} className="btn-primary text-xs py-1.5 px-3">
                          Track <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button className="btn-ghost text-sm p-2">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CollaborationRequests;
