import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, X, MessageSquare, Calendar, Link2, Lock, ChevronDown, ChevronUp, Bell, Inbox, ArrowRight } from 'lucide-react';
import { getRequests, acceptCampaign, declineCampaign } from '../api/creatorApi';
import { useCampaignSocket } from '../hooks/useCampaignSocket';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
];

// Status values that mean the creator has already accepted
const ACCEPTED_STATUSES = [
  'creator_accepted', 'agreement_locked', 'escrow_locked',
  'content_uploaded', 'brand_approved', 'posted_live',
  'analytics_collected', 'payment_released', 'campaign_closed'
];

export default function IncomingRequestsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['requests', activeTab, search],
    queryFn: () => getRequests({ status: activeTab, search }).then(r => r.data.data)
  });

  const acceptMut = useMutation({
    mutationFn: (id) => acceptCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const declineMut = useMutation({
    mutationFn: (id) => declineCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const counts = data?.counts || { pending: 0, accepted: 0, completed: 0, total: 0 };
  const campaigns = data?.campaigns || [];

  // Subscribe to WebSocket for all campaign IDs in the list
  const campaignIds = campaigns.map(c => c.campaign_id || c.id).filter(Boolean);
  useCampaignSocket(campaignIds);

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-slate-200 rounded"></div>
          <div className="h-40 w-full bg-white rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="text-[34px] font-[900] text-[#0f172a] tracking-tight uppercase leading-none mb-3" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.05em' }}>
            Collaboration Requests
          </div>
          <div className="text-[14px] text-slate-500 font-medium">
            {counts.pending} new requests need your response within 48 hours
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge" style={{ padding: '6px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>{counts.pending} Pending</span>
          <span className="badge" style={{ padding: '6px 12px', background: '#D1FAE5', color: '#065F46', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>{counts.accepted} Accepted</span>
          <span className="badge" style={{ padding: '6px 12px', background: '#F3F4F6', color: '#4B5563', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>{counts.completed} Completed</span>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
                padding: '8px 16px', 
                borderRadius: '10px', 
                fontSize: '13px', 
                fontWeight: '700',
                background: activeTab === tab.key ? 'var(--blue)' : 'white',
                color: activeTab === tab.key ? 'white' : '#64748b',
                border: activeTab === tab.key ? 'none' : '1px solid #e2e8f0'
            }}
          >
            {tab.label} ({tab.key === 'all' ? counts.total : counts[tab.key] || 0})
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {campaigns.length > 0 ? (
          campaigns.map((c) => {
            const isPending = c.status === 'request_sent';
            const isAccepted = ACCEPTED_STATUSES.includes(c.status);
            const isDeclined = c.status === 'declined';
            const isExpanded = expandedId === c.campaign_id;
            
            const iconBg = c.platform === 'instagram' ? '#fff3e0' : '#fce4ec';
            const iconColor = c.platform === 'instagram' ? '#e65100' : '#c2185b';
            
            // Border Left colors
            let leftBorder = '4px solid #e2e8f0';
            if (isPending) leftBorder = '4px solid #ef4444';
            else if (isAccepted) leftBorder = '4px solid #10b981';
            else if (isDeclined) leftBorder = '4px solid #94a3b8';

            // Safe field access with fallbacks
            const brandName = c.brand_name || c.brand || 'Brand';
            const deliverable = c.deliverable || c.content_type || '—';
            const amount = c.amount ?? c.campaign_amount ?? 0;
            const respondBy = c.respond_by ? new Date(c.respond_by).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;

            return (
              <div key={c.campaign_id} className="card" style={{ borderLeft: leftBorder, background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="card-body" style={{ paddingTop: '20px', paddingBottom: '20px', paddingLeft: '20px', paddingRight: '20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
                    {/* Brand Initial Circle */}
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '12px', 
                      background: iconBg, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '800', 
                      fontSize: '14px', 
                      color: iconColor, 
                      flexShrink: 0 
                    }}>
                      {c.brand_initials || brandName?.[0]?.toUpperCase() || 'B'}
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      {/* Title & Price Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-1)' }}>
                            {brandName} — {c.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                            {deliverable} {c.content_type && c.content_type !== deliverable ? `· ${c.content_type}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: '800', color: 'var(--blue)' }}>
                            ₹{Number(amount).toLocaleString('en-IN')}
                          </div>
                          {isPending && respondBy && (
                            <span className="badge badge-red" style={{ gap: '6px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }}></span>
                              Respond by {respondBy}
                            </span>
                          )}
                          {isAccepted && (
                            <span style={{ padding: '3px 10px', background: '#D1FAE5', color: '#065F46', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
                              ✓ Accepted
                            </span>
                          )}
                          {isDeclined && (
                            <span style={{ padding: '3px 10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
                              Declined
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Campaign Brief */}
                      {(isPending || isExpanded) && c.brief && (
                        <div style={{ background: 'var(--bg-page)', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase' }}>CAMPAIGN BRIEF</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6' }}>{c.brief}</div>
                        </div>
                      )}

                      {/* Metadata Row */}
                      {(isPending || isExpanded) && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {c.timeline_label && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>📅 Timeline: <strong>{c.timeline_label}</strong></div>}
                          {c.tracking_label && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>🔗 Tracking Link: <strong>{c.tracking_label}</strong></div>}
                          {c.escrow_label && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>💰 Escrow: <strong>{c.escrow_label}</strong></div>}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {isPending ? (
                          <>
                            <button 
                              onClick={() => acceptMut.mutate(c.campaign_id)}
                              className="btn btn-primary"
                              disabled={acceptMut.isPending}
                              style={{ padding: '8px 20px' }}
                            >
                              ✓ {acceptMut.isPending ? 'Accepting...' : 'Accept Collaboration'}
                            </button>
                            <button className="btn btn-outline" style={{ background: 'transparent' }}>
                              Negotiate Rate
                            </button>
                            <button 
                              onClick={() => declineMut.mutate(c.campaign_id)}
                              className="btn btn-sm" 
                              style={{ color: 'var(--red)', background: 'transparent', border: 'none', fontWeight: '700' }}
                            >
                              ✕ Decline
                            </button>
                          </>
                        ) : isAccepted ? (
                          <>
                            <button 
                              onClick={() => navigate('/campaigns')}
                              className="btn btn-primary"
                              style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              View Campaign <ArrowRight size={14} />
                            </button>
                            <button 
                              onClick={() => setExpandedId(isExpanded ? null : c.campaign_id)}
                              className="btn btn-outline"
                              style={{ background: 'transparent' }}
                            >
                              {isExpanded ? 'Close Brief' : 'View Brief'}
                            </button>
                          </>
                        ) : isDeclined ? (
                          <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>This request was declined.</span>
                        ) : (
                          <button 
                            onClick={() => setExpandedId(isExpanded ? null : c.campaign_id)}
                            className="btn btn-outline"
                            style={{ background: 'transparent' }}
                          >
                            {isExpanded ? 'Close Brief' : 'View Full Brief'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
            <Inbox size={40} className="text-slate-200 mx-auto mb-4" />
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>No Requests Found</div>
            <p style={{ color: '#94a3b8', marginTop: '4px' }}>We couldn't find any campaign requests in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
