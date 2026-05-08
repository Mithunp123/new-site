import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, X, ArrowRight, Inbox, ChevronDown, ChevronUp } from 'lucide-react';
import { getRequests, acceptCampaign, declineCampaign } from '../api/creatorApi';
import { useCampaignSocket } from '../hooks/useCampaignSocket';
import useAuthStore from '../store/authStore';

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'accepted',  label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
];

const ACCEPTED_STATUSES = [
  'creator_accepted', 'agreement_locked', 'escrow_locked',
  'content_uploaded', 'brand_approved', 'posted_live',
  'analytics_collected', 'payment_released', 'escrow_released', 'campaign_closed',
];

export default function IncomingRequestsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const userId = useAuthStore(state => state.user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ['requests', userId, activeTab, search],
    queryFn: () => getRequests({ status: activeTab, search }).then(r => r.data.data),
    enabled: !!userId,
  });

  const acceptMut = useMutation({
    mutationFn: (id) => acceptCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const declineMut = useMutation({
    mutationFn: (id) => declineCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  const counts    = data?.counts    || { pending: 0, accepted: 0, completed: 0, total: 0 };
  const campaigns = data?.campaigns || [];
  const campaignIds = data?.campaigns?.map(c => c.campaign_id) || [];
  useCampaignSocket(campaignIds);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-slate-100 rounded-lg" />
        <div className="h-40 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Collaboration Requests</h1>
          <p className="page-subtitle">{counts.pending} new requests need your response within 48 hours</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red">{counts.pending} Pending</span>
          <span className="badge badge-green">{counts.accepted} Accepted</span>
          <span className="badge badge-gray">{counts.completed} Completed</span>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-[#2563EB]' : 'text-slate-400'}`}>
                ({tab.key === 'all' ? counts.total : counts[tab.key] || 0})
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-64"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {campaigns.length > 0 ? (
          campaigns.map(c => {
            const isPending  = c.status === 'request_sent';
            const isAccepted = ACCEPTED_STATUSES.includes(c.status);
            const isDeclined = c.status === 'declined';
            const isExpanded = expandedId === c.campaign_id;

            const brandName  = c.brand_name || c.brand || 'Brand';
            const deliverable = c.deliverable || c.content_type || '—';
            const amount     = c.amount ?? c.campaign_amount ?? 0;
            const respondBy  = c.respond_by
              ? new Date(c.respond_by).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : null;

            return (
              <motion.div
                key={c.campaign_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card overflow-hidden border-l-4 ${
                  isPending  ? 'border-l-red-400' :
                  isAccepted ? 'border-l-emerald-400' :
                  isDeclined ? 'border-l-slate-300' : 'border-l-slate-200'
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-[#2563EB] text-sm flex-shrink-0">
                      {c.brand_initials || brandName?.[0]?.toUpperCase() || 'B'}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">{brandName} — {c.title}</p>
                          <p className="text-sm text-slate-400 mt-0.5">{deliverable}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-[#2563EB]">₹{Number(amount).toLocaleString('en-IN')}</p>
                          {isPending && respondBy && (
                            <span className="badge badge-red mt-1">Respond by {respondBy}</span>
                          )}
                          {isAccepted && <span className="badge badge-green mt-1">✓ Accepted</span>}
                          {isDeclined && <span className="badge badge-red mt-1">Declined</span>}
                        </div>
                      </div>

                      {/* Brief */}
                      <AnimatePresence>
                        {(isPending || isExpanded) && c.brief && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-50 rounded-xl p-4 mb-3 border border-slate-100"
                          >
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Campaign Brief</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{c.brief}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Meta */}
                      {(isPending || isExpanded) && (
                        <div className="flex flex-wrap gap-4 mb-3 text-sm text-slate-500">
                          {c.timeline_label && <span>📅 {c.timeline_label}</span>}
                          {c.tracking_label  && <span>🔗 {c.tracking_label}</span>}
                          {c.escrow_label    && <span>💰 {c.escrow_label}</span>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => acceptMut.mutate(c.campaign_id)}
                              disabled={acceptMut.isPending}
                              className="btn-primary"
                            >
                              <Check size={14} /> {acceptMut.isPending ? 'Accepting...' : 'Accept'}
                            </button>
                            <button className="btn-secondary">Negotiate Rate</button>
                            <button
                              onClick={() => declineMut.mutate(c.campaign_id)}
                              className="text-sm text-red-500 hover:text-red-600 font-medium px-2 py-1"
                            >
                              Decline
                            </button>
                          </>
                        ) : isAccepted ? (
                          <>
                            <button onClick={() => navigate('/campaigns')} className="btn-primary">
                              View Campaign <ArrowRight size={14} />
                            </button>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : c.campaign_id)}
                              className="btn-secondary"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {isExpanded ? 'Hide Brief' : 'View Brief'}
                            </button>
                          </>
                        ) : isDeclined ? (
                          <span className="text-sm text-slate-400">This request was declined.</span>
                        ) : (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c.campaign_id)}
                            className="btn-secondary"
                          >
                            {isExpanded ? 'Hide Brief' : 'View Brief'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="card p-16 text-center border-dashed">
            <Inbox size={36} className="text-slate-200 mx-auto mb-4" />
            <p className="text-base font-semibold text-slate-700">No Requests Found</p>
            <p className="text-sm text-slate-400 mt-1">No campaign requests in this category.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
