import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, X, ArrowRight, Inbox, ChevronDown, ChevronUp, Calendar, Link2, DollarSign, Target, Film, Package, Clock, AlertTriangle } from 'lucide-react';
import {
  getRequests,
  acceptCampaign,
  declineCampaign,
  submitNegotiation,
  acceptOffer,
} from '../api/creatorApi';
import { useCampaignSocket } from '../hooks/useCampaignSocket';
import useAuthStore from '../store/authStore';
import LottieIcon from '../components/ui/LottieIcon';

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
  const [activeTab, setActiveTab]           = useState('all');
  const [search, setSearch]                 = useState('');
  const [expandedId, setExpandedId]         = useState(null);
  const [negotiatingId, setNegotiatingId]   = useState(null);
  const [negotiateAmount, setNegotiateAmount] = useState('');
  const [negotiateMessage, setNegotiateMessage] = useState('');
  const [confirmAction, setConfirmAction]   = useState(null); // { type: 'accept'|'decline'|'accept_offer', id, data }
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const userId = useAuthStore(state => state.user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ['requests', userId, activeTab, search],
    queryFn: () => getRequests({ status: activeTab, search }).then(r => r.data.data),
    refetchOnMount: 'always',
    staleTime: 0,
    enabled: !!userId,
  });

  const acceptMut = useMutation({
    mutationFn: (id) => acceptCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmAction(null);
    },
  });

  const declineMut = useMutation({
    mutationFn: (id) => declineCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmAction(null);
    },
  });

  const negotiateMut = useMutation({
    mutationFn: ({ id, amount, message }) => submitNegotiation(id, { amount: Number(amount), message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNegotiatingId(null);
      setNegotiateAmount('');
      setNegotiateMessage('');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to submit offer. Please try again.');
    }
  });

  const acceptOfferMut = useMutation({
    mutationFn: (id) => acceptOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmAction(null);
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              {confirmAction.type === 'accept' && (
                <>
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                    <Check size={24} className="text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Accept This Campaign?</h3>
                  <p className="text-sm text-slate-500 mb-5">By accepting, you agree to the campaign terms. The brand will be notified and can proceed to lock escrow.</p>
                  <div className="flex gap-3">
                    <button onClick={() => acceptMut.mutate(confirmAction.id)} disabled={acceptMut.isPending} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-60">
                      {acceptMut.isPending ? 'Accepting...' : 'Yes, Accept'}
                    </button>
                    <button onClick={() => setConfirmAction(null)} className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200">Cancel</button>
                  </div>
                </>
              )}
              {confirmAction.type === 'decline' && (
                <>
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                    <X size={24} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Decline This Campaign?</h3>
                  <p className="text-sm text-slate-500 mb-5">This action cannot be undone. The brand will be notified.</p>
                  <div className="flex gap-3">
                    <button onClick={() => declineMut.mutate(confirmAction.id)} disabled={declineMut.isPending} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-60">
                      {declineMut.isPending ? 'Declining...' : 'Yes, Decline'}
                    </button>
                    <button onClick={() => setConfirmAction(null)} className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200">Cancel</button>
                  </div>
                </>
              )}
              {confirmAction.type === 'accept_offer' && (
                <>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <Check size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Accept This Offer?</h3>
                  <p className="text-sm text-slate-500 mb-2">You are accepting the negotiated offer. This will lock the deal.</p>
                  <p className="text-lg font-bold text-blue-600 mb-5">₹{Number(confirmAction.data?.amount || 0).toLocaleString('en-IN')}</p>
                  <div className="flex gap-3">
                    <button onClick={() => acceptOfferMut.mutate(confirmAction.id)} disabled={acceptOfferMut.isPending} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-60">
                      {acceptOfferMut.isPending ? 'Accepting...' : 'Confirm & Accept'}
                    </button>
                    <button onClick={() => setConfirmAction(null)} className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200">Cancel</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Collaboration Requests</h1>
          <p className="page-subtitle">{counts.pending} new requests need your response</p>
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
                activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-blue-600' : 'text-slate-400'}`}>
                ({tab.key === 'all' ? counts.total : counts[tab.key] || 0})
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 w-64" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {campaigns.length > 0 ? (
          campaigns.map(c => {
            const isPending    = c.status === 'request_sent';
            const isNegotiating = c.status === 'negotiating';
            const isAccepted   = ACCEPTED_STATUSES.includes(c.status);
            const isDeclined   = c.status === 'declined';
            const isExpanded   = expandedId === c.campaign_id;
            const isNegForm    = negotiatingId === c.campaign_id;

            const brandName   = c.brand_name || c.brand || 'Brand';
            const deliverable = c.deliverable || c.content_type || '—';
            const amount      = (isNegotiating && c.negotiate_amount) ? c.negotiate_amount : (c.amount ?? c.campaign_amount ?? 0);
            const respondBy   = c.respond_by ? new Date(c.respond_by).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;
            const negotiations = c.negotiations || [];

            // Parse content types if available
            let contentTypes = [];
            try { contentTypes = c.content_types ? (typeof c.content_types === 'string' ? JSON.parse(c.content_types) : c.content_types) : []; } catch {}

            return (
              <motion.div
                key={c.campaign_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card overflow-hidden border-l-4 ${
                  isPending    ? 'border-l-red-400' :
                  isNegotiating ? 'border-l-amber-400' :
                  isAccepted   ? 'border-l-emerald-400' :
                  isDeclined   ? 'border-l-slate-300' : 'border-l-slate-200'
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0">
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
                          <p className="text-xl font-bold text-blue-600">₹{Number(amount).toLocaleString('en-IN')}</p>
                          {isPending && respondBy && <span className="badge badge-red mt-1">Respond by {respondBy}</span>}
                          {isNegotiating && <span className="badge badge-orange mt-1">Negotiating</span>}
                          {isAccepted && <span className="badge badge-green mt-1">Accepted</span>}
                          {isDeclined && <span className="badge badge-red mt-1">Declined</span>}
                        </div>
                      </div>

                      {/* Full Campaign Details — always shown for pending/negotiating, togglable for others */}
                      <AnimatePresence>
                        {(isPending || isNegotiating || isExpanded) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 mb-3"
                          >
                            {/* Campaign Brief */}
                            {c.brief && (
                              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Campaign Brief</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{c.brief}</p>
                              </div>
                            )}

                            {/* Campaign Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {c.platform && (
                                <DetailCard icon={Target} label="Platform" value={c.platform} />
                              )}
                              {c.campaign_goal && (
                                <DetailCard icon={Target} label="Goal" value={c.campaign_goal} />
                              )}
                              {c.start_date && c.deadline && (
                                <DetailCard icon={Calendar} label="Timeline" value={`${new Date(c.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → ${new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`} />
                              )}
                              {c.number_of_posts && (
                                <DetailCard icon={Package} label="Posts Required" value={`${c.number_of_posts} deliverables`} />
                              )}
                            </div>

                            {/* Content Types */}
                            {contentTypes.length > 0 && (
                              <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100/50">
                                <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider mb-2">Required Deliverables</p>
                                <div className="flex flex-wrap gap-2">
                                  {contentTypes.map((ct, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs font-semibold text-purple-700 border border-purple-100 shadow-sm">
                                      <Film size={10} />
                                      {ct.quantity}x {ct.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Additional details */}
                            {c.deliverables_required && (
                              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Additional Requirements</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{c.deliverables_required}</p>
                              </div>
                            )}

                            {/* Meta info */}
                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                              {c.tracking_link && (
                                <span className="flex items-center gap-1"><Link2 size={13} /> Tracking link included</span>
                              )}
                              {c.escrow_label && (
                                <span className="flex items-center gap-1"><DollarSign size={13} /> {c.escrow_label}</span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Negotiation history */}
                      {isNegotiating && negotiations.length > 0 && (
                        <div className="mb-3 space-y-2">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Negotiation History</p>
                          {negotiations.map((neg, idx) => (
                            <div key={neg.id || idx} className={`rounded-lg p-3 text-sm border ${neg.proposed_by === 'creator' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-700 capitalize">{neg.proposed_by}</span>
                                <span className="font-bold text-blue-600">₹{Number(neg.amount).toLocaleString('en-IN')}</span>
                              </div>
                              {neg.message && <p className="text-slate-500 text-xs">{neg.message}</p>}
                            </div>
                          ))}
                          {c.negotiate_amount && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                              <span className="text-amber-700 font-semibold">Current offer: </span>
                              <span className="text-amber-900 font-bold">₹{Number(c.negotiate_amount).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Negotiate inline form */}
                      <AnimatePresence>
                        {isNegForm && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                          >
                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <LottieIcon name="handshake" size={16} /> Submit Counter-Offer
                            </p>
                            <input type="number" placeholder="Proposed amount (₹)" value={negotiateAmount} onChange={e => setNegotiateAmount(e.target.value)} className="input w-full" min="1" />
                            <textarea placeholder="Message (optional)" value={negotiateMessage} onChange={e => setNegotiateMessage(e.target.value)} className="input w-full resize-none" rows={2} />
                            <div className="flex gap-2">
                              <button onClick={() => negotiateMut.mutate({ id: c.campaign_id, amount: negotiateAmount, message: negotiateMessage })} disabled={!negotiateAmount || negotiateMut.isPending} className="btn-primary flex items-center gap-1">
                                <LottieIcon name="send" size={14} /> {negotiateMut.isPending ? 'Submitting...' : 'Submit Offer'}
                              </button>
                              <button onClick={() => { setNegotiatingId(null); setNegotiateAmount(''); setNegotiateMessage(''); }} className="btn-ghost"><X size={14} /> Cancel</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isPending ? (
                          <>
                            <button onClick={() => setConfirmAction({ type: 'accept', id: c.campaign_id })} className="btn-primary flex items-center gap-1">
                              <Check size={14} /> Accept
                            </button>
                            <button onClick={() => { setNegotiatingId(c.campaign_id); setNegotiateAmount(''); setNegotiateMessage(''); }} className="btn-secondary flex items-center gap-1">
                              <LottieIcon name="handshake" size={14} /> Negotiate
                            </button>
                            <button onClick={() => setConfirmAction({ type: 'decline', id: c.campaign_id })} className="text-sm text-red-500 hover:text-red-600 font-medium px-2 py-1">
                              Decline
                            </button>
                          </>
                        ) : isNegotiating ? (
                          <>
                            <button onClick={() => setConfirmAction({ type: 'accept_offer', id: c.campaign_id, data: { amount: c.negotiate_amount } })} className="btn-primary flex items-center gap-1">
                              <Check size={14} /> Accept Offer
                            </button>
                            <button onClick={() => { setNegotiatingId(c.campaign_id); setNegotiateAmount(''); setNegotiateMessage(''); }} className="btn-secondary flex items-center gap-1">
                              <LottieIcon name="handshake" size={14} /> Counter Offer
                            </button>
                          </>
                        ) : isAccepted ? (
                          <>
                            <button onClick={() => navigate('/campaigns')} className="btn-primary flex items-center gap-1">
                              View Campaign <ArrowRight size={14} />
                            </button>
                            <button onClick={() => setExpandedId(isExpanded ? null : c.campaign_id)} className="btn-secondary flex items-center gap-1">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {isExpanded ? 'Hide Details' : 'View Details'}
                            </button>
                          </>
                        ) : isDeclined ? (
                          <span className="text-sm text-slate-400">This request was declined.</span>
                        ) : (
                          <button onClick={() => setExpandedId(isExpanded ? null : c.campaign_id)} className="btn-secondary flex items-center gap-1">
                            {isExpanded ? 'Hide Details' : 'View Details'}
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

// Small detail card component for campaign info
const DetailCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-lg p-3 border border-slate-100">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={11} className="text-slate-400" />
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-xs font-semibold text-slate-700">{value}</p>
  </div>
);
