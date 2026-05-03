import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Check, X, MessageSquare, Calendar, Link2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { getRequests, acceptCampaign, declineCampaign } from '../api/creatorApi';
import Badge from '../components/ui/Badge';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
];

export default function IncomingRequestsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['requests', activeTab, search],
    queryFn: () => getRequests({ status: activeTab, search }).then(r => r.data.data)
  });

  const acceptMut = useMutation({
    mutationFn: (id) => acceptCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] })
  });

  const declineMut = useMutation({
    mutationFn: (id) => declineCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] })
  });

  const counts = data?.counts || { pending: 0, accepted: 0, completed: 0, total: 0 };
  const campaigns = data?.campaigns || [];

  const borderColor = (status) => {
    if (status === 'request_sent') return 'border-l-red-500';
    if (['creator_accepted', 'agreement_locked'].includes(status)) return 'border-l-green-500';
    if (['content_uploaded', 'brand_approved'].includes(status)) return 'border-l-orange-500';
    return 'border-l-slate-300';
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse"></div>)}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Collaboration Requests</h1>
          <p className="text-slate-500 text-sm mt-1">{counts.pending} new requests need your response within 48 hours</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">{counts.pending} Pending</span>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">{counts.accepted} Accepted</span>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">{counts.completed} Completed</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab.label} ({tab.key === 'all' ? counts.total : counts[tab.key] || 0})
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition" />
        </div>
      </div>

      {/* Request Cards */}
      <div className="space-y-4">
        {campaigns.map((c, i) => {
          const isExpanded = expandedId === c.id;
          const respondDate = c.respond_by ? new Date(c.respond_by) : null;
          const daysToRespond = respondDate ? Math.ceil((respondDate - new Date()) / (1000*60*60*24)) : null;

          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-xl border border-slate-100 shadow-sm border-l-4 ${borderColor(c.status)} overflow-hidden card-hover`}>
              {/* Header row */}
              <div className="flex items-center justify-between px-6 py-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 font-heading">
                    {c.brand_name?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 font-heading">{c.brand_name}</span>
                      <span className="text-slate-400">—</span>
                      <span className="text-slate-600">{c.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.deliverable}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-blue-600 font-heading">₹{c.escrow_amount?.toLocaleString('en-IN')}</span>
                  {respondDate && c.status === 'request_sent' && (
                    <span className={`text-xs font-medium ${daysToRespond <= 2 ? 'text-red-500' : 'text-orange-500'}`}>
                      Respond by {respondDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <Badge status={c.status} />
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.2 }}
                  className="px-6 pb-6 border-t border-slate-100">
                  <div className="pt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Campaign Brief</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.brief}</p>

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} /> Deadline: {new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Link2 size={14} /> Tracking Link: Provided
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Lock size={14} /> Escrow: {c.escrow_status === 'held' ? 'Secured' : c.escrow_status === 'pending' ? 'Pending' : 'Released'}
                      </div>
                    </div>

                    {c.status === 'request_sent' && (
                      <div className="flex items-center gap-3 mt-5">
                        <button onClick={() => acceptMut.mutate(c.id)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition hover:scale-[1.02]">
                          <Check size={14} /> Accept Collaboration
                        </button>
                        <button className="flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-lg font-medium text-sm transition">
                          <MessageSquare size={14} /> Negotiate Rate
                        </button>
                        <button onClick={() => declineMut.mutate(c.id)}
                          className="flex items-center gap-2 border border-red-400 text-red-400 hover:bg-red-50 px-5 py-2.5 rounded-lg font-medium text-sm transition">
                          <X size={14} /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Collapsed buttons */}
              {!isExpanded && c.status === 'request_sent' && (
                <div className="flex items-center gap-2 px-6 pb-4">
                  <button onClick={(e) => { e.stopPropagation(); acceptMut.mutate(c.id); }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg font-medium text-xs transition">
                    <Check size={12} /> Accept
                  </button>
                  <button onClick={() => setExpandedId(c.id)}
                    className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg font-medium text-xs transition">
                    View Full Brief
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); declineMut.mutate(c.id); }}
                    className="flex items-center gap-1.5 border border-red-300 text-red-400 hover:bg-red-50 px-3.5 py-1.5 rounded-lg font-medium text-xs transition">
                    <X size={12} /> Decline
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
