import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Check, X, MessageCircle, Eye, 
  History, TrendingUp, Briefcase, Sparkles, 
  ArrowUpRight, Handshake, AlertCircle, Clock
} from 'lucide-react';
import { useCampaignSocket } from '../../hooks/useCampaignSocket';

const CollaborationRequests = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [negotiatingId, setNegotiatingId] = useState(null);
  const [negotiateAmount, setNegotiateAmount] = useState('');
  const [negotiateMessage, setNegotiateMessage] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg: '' }

  const { data, isLoading } = useQuery({
    queryKey: ['brand-requests'],
    queryFn: async () => {
      const res = await api.get('/api/brand/collaboration/requests');
      return res.data.data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const campaignIds = data?.requests?.map(r => r.campaign_id) || [];
  useCampaignSocket(campaignIds);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Brand sends counter-offer: POST /api/campaign/:id/negotiate
  const negotiateMut = useMutation({
    mutationFn: async ({ id, amount, message }) => {
      return api.post(`/api/campaign/${id}/negotiate`, { amount: Number(amount), message });
    },
    onSuccess: () => {
      showFeedback('success', 'Counter-offer sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['brand-requests'] });
      setNegotiatingId(null);
      setNegotiateAmount('');
      setNegotiateMessage('');
    },
    onError: (err) => showFeedback('error', err.response?.data?.message || 'Failed to send offer')
  });

  // Brand accepts the current offer: PUT /api/campaign/:id/accept-offer
  const acceptMut = useMutation({
    mutationFn: async (id) => {
      return api.put(`/api/campaign/${id}/accept-offer`);
    },
    onSuccess: () => {
      showFeedback('success', 'Offer accepted!');
      queryClient.invalidateQueries({ queryKey: ['brand-requests'] });
      setNegotiatingId(null);
    },
    onError: (err) => showFeedback('error', err.response?.data?.message || 'Failed to accept offer')
  });

  if (isLoading) return <div className="p-8">Loading requests...</div>;

  const stats = [
    { label: 'Sent Requests', value: data?.sent_count || 0, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Acceptance', value: data?.pending_count || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Collaborations', value: data?.collabed_count || 0, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'negotiating') return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Negotiating</span>;
    if (s === 'request_sent') return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Request Sent</span>;
    if (s === 'creator_accepted') return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Accepted</span>;
    if (s === 'declined') return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Declined</span>;
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">{status}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      
      {/* Inline feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold ${
              feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Collaboration Inbox</h1>
          <p className="text-slate-500 text-sm">Manage your sent requests and price negotiations.</p>
        </div>
        <button onClick={() => navigate('/brand/discover')} className="btn-primary flex items-center gap-2 self-start">
          <Sparkles size={16} /> New Collaboration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {data?.requests?.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-900">No requests found</p>
            <p className="text-slate-500 max-w-xs mt-1">When you send collaboration requests to creators, they will appear here for management.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Creator</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Campaign Title</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Investment</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.requests.map((req) => {
                  const isNegForm = negotiatingId === req.campaign_id;
                  const isNegotiating = req.status?.toLowerCase() === 'negotiating';
                  
                  return (
                    <React.Fragment key={req.campaign_id}>
                      <tr className={`group hover:bg-slate-50/50 transition-colors ${isNegForm ? 'bg-slate-50' : ''}`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200" style={{ backgroundColor: req.avatar_color + '20', color: req.avatar_color, borderColor: req.avatar_color + '40' }}>
                              {req.creator_initials || 'CR'}
                            </div>
                            <span className="font-bold text-slate-900">{req.creator_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600 font-medium">{req.campaign_title}</td>
                        <td className="px-6 py-5">
                          {isNegotiating && req.negotiate_amount ? (
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-400 line-through">₹{Number(req.original_budget).toLocaleString('en-IN')}</p>
                              <p className="text-sm font-black text-amber-600">₹{Number(req.negotiate_amount).toLocaleString('en-IN')}</p>
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-slate-900">₹{Number(req.original_budget).toLocaleString('en-IN')}</p>
                          )}
                        </td>
                        <td className="px-6 py-5">{getStatusBadge(req.status)}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {isNegotiating ? (
                              <button 
                                onClick={() => {
                                  setNegotiatingId(isNegForm ? null : req.campaign_id);
                                  setNegotiateAmount('');
                                  setNegotiateMessage('');
                                }}
                                className={`p-2.5 rounded-xl transition-all ${isNegForm ? 'bg-amber-100 text-amber-600 shadow-inner' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                              >
                                <MessageCircle size={20} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => navigate('/brand/campaign-tracking')}
                                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                              >
                                <Eye size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      <AnimatePresence>
                        {isNegForm && (
                          <tr>
                            <td colSpan="5" className="px-0 py-0">
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-slate-50 border-b border-slate-200"
                              >
                                <div className="p-6 flex flex-col lg:flex-row gap-8">
                                  {/* History Section */}
                                  <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-2">
                                      <History size={18} className="text-slate-400" />
                                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Negotiation History</h4>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                      {req.negotiations?.length > 0 ? (
                                        req.negotiations.map((neg, idx) => (
                                          <div key={idx} className={`p-4 rounded-2xl border ${neg.proposed_by === 'brand' ? 'bg-blue-50 border-blue-100 ml-8' : 'bg-white border-slate-200 mr-8 shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                              <span className={`text-[10px] font-black uppercase tracking-widest ${neg.proposed_by === 'brand' ? 'text-blue-600' : 'text-slate-400'}`}>
                                                {neg.proposed_by === 'brand' ? 'You' : req.creator_name}
                                              </span>
                                              <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(neg.created_at).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <p className="text-base font-black text-slate-900">₹{Number(neg.amount).toLocaleString('en-IN')}</p>
                                            {neg.message && <p className="text-xs text-slate-600 mt-2 leading-relaxed italic">"{neg.message}"</p>}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                                          <p className="text-xs text-slate-400 font-medium">No previous messages.</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Section */}
                                  <div className="w-full lg:w-80 flex flex-col gap-4">
                                    {/* Decision Box */}
                                    <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 shadow-sm space-y-4">
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">Current Proposal</p>
                                        <p className="text-3xl font-black text-amber-900">₹{Number(req.negotiate_amount || req.original_budget).toLocaleString('en-IN')}</p>
                                      </div>

                                      <div className="pt-4 border-t border-amber-200/50 space-y-2">
                                        <div className="flex justify-between text-xs font-medium text-amber-800">
                                          <span>Platform Fee (8%):</span>
                                          <span>₹{Math.round(Number(req.negotiate_amount || req.original_budget) * 0.08).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-black text-amber-950 pt-1">
                                          <span>Total Payable:</span>
                                          <span>₹{Math.round(Number(req.negotiate_amount || req.original_budget) * 1.08).toLocaleString('en-IN')}</span>
                                        </div>
                                      </div>

                                      {req.negotiate_message && (
                                        <div className="bg-white/60 rounded-xl p-3 text-xs text-amber-900 leading-relaxed border border-amber-200/50">
                                          "{req.negotiate_message}"
                                        </div>
                                      )}

                                      <button 
                                        onClick={() => acceptMut.mutate(req.campaign_id)}
                                        disabled={acceptMut.isPending}
                                        className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
                                      >
                                        <Check size={18} /> {acceptMut.isPending ? 'Accepting...' : 'Accept & Lock Offer'}
                                      </button>
                                    </div>

                                    {/* Counter-Offer Box */}
                                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                      <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-blue-600" />
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Counter-Offer</p>
                                      </div>
                                      <div className="space-y-3">
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                          <input 
                                            type="number" 
                                            placeholder="Enter amount"
                                            value={negotiateAmount}
                                            onChange={(e) => setNegotiateAmount(e.target.value)}
                                            className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                          />
                                        </div>
                                        <textarea 
                                          placeholder="Message to creator..."
                                          value={negotiateMessage}
                                          onChange={(e) => setNegotiateMessage(e.target.value)}
                                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium h-24 resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        />
                                        <button 
                                          onClick={() => negotiateMut.mutate({ id: req.campaign_id, amount: negotiateAmount, message: negotiateMessage })}
                                          disabled={!negotiateAmount || negotiateMut.isPending}
                                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                          <Send size={16} /> {negotiateMut.isPending ? 'Sending...' : 'Send Counter'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CollaborationRequests;
