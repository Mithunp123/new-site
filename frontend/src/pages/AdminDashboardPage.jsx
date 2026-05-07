import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building2, Zap, TrendingUp, 
  FileText, CheckCircle, XCircle, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Search,
  MoreVertical, Target, Shield, AlertCircle
} from 'lucide-react';
import * as adminApi from "../api/adminApi";
import { formatCount } from "../utils/format";
import StatCard from "../components/ui/StatCard";

const SectionHeader = ({ title, subValue, badgeColor, icon: Icon }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
       {Icon && <Icon size={20} className="text-brand-blue" strokeWidth={2.5} />}
       {title}
    </h2>
    {subValue && (
      <span className={`badge ${badgeColor}`}>
        {subValue}
      </span>
    )}
  </div>
);

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCreators, setPendingCreators] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, creatorsRes, disputesRes] = await Promise.all([
          adminApi.getAdminDashboard(),
          adminApi.getCreators({ status: 'unverified', limit: 4 }),
          adminApi.getDisputes({ status: 'open', limit: 3 })
        ]);
        
        setDashboard(dashRes.data.data);
        setPendingCreators(creatorsRes.data.data.creators || []);
        setDisputes(disputesRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Admin Control Panel</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Platform-wide monitoring and moderation</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 py-2 text-xs">
          Generate Report
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          label="Total Users" 
          value={(dashboard?.total_creators + dashboard?.total_brands).toLocaleString()} 
          change={dashboard?.new_creators_this_month + dashboard?.new_brands_this_month}
          changeLabel="New this month"
          icon={Users}
          index={0}
        />
        <StatCard 
          label="Creators" 
          value={dashboard?.total_creators?.toLocaleString() || '0'} 
          change={dashboard?.new_creators_this_month}
          changeLabel="New creators"
          icon={Target}
          index={1}
        />
        <StatCard 
          label="Brands" 
          value={dashboard?.total_brands?.toLocaleString() || '0'} 
          change={dashboard?.new_brands_this_month}
          changeLabel="New brands"
          icon={Building2}
          index={2}
        />
        <StatCard 
          label="Commissions" 
          value={formatCurrency(dashboard?.commission_this_month)} 
          changeLabel="Live revenue"
          icon={Zap}
          variant="blue"
          index={3}
        />
        <StatCard 
          label="Campaigns" 
          value={dashboard?.active_campaigns || 0} 
          changeLabel="Across platform"
          icon={TrendingUp}
          index={4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Main Tables */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile Approval Queue */}
          <div className="card-premium overflow-hidden">
            <div className="p-5 border-b border-slate-50/50">
              <SectionHeader 
                title="Approval Queue" 
                subValue={`${dashboard?.pending_verifications || 0} Pending`} 
                badgeColor="badge-orange" 
                icon={Shield}
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Category</th>
                    <th>Reach</th>
                    <th>Submitted</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCreators.map((item) => (
                    <tr key={item.id} className="group transition-colors">
                      <td>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.platforms?.map(p => (
                              <span key={p} className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                {p === 'instagram' ? (
                                  <svg className="w-2.5 h-2.5 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                ) : p === 'youtube' ? (
                                  <svg className="w-2.5 h-2.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                                ) : null}
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue">Creator</span>
                      </td>
                      <td>
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100/50 px-2 py-1 rounded-lg uppercase tracking-tight">{item.category || 'Niche'}</span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          {item.instagram_followers > 0 && (
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="text-[9px] font-black text-pink-500 uppercase">IG</span>
                              <span className="text-[11px] font-bold text-slate-700">{formatCount(Number(item.instagram_followers))}</span>
                            </div>
                          )}
                          {item.youtube_followers > 0 && (
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="text-[9px] font-black text-red-600 uppercase">YT</span>
                              <span className="text-[11px] font-bold text-slate-700">{formatCount(Number(item.youtube_followers))}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-xs text-slate-400 font-bold">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            disabled={!!processingId}
                            onClick={async () => {
                              setProcessingId(item.id);
                              try {
                                await adminApi.verifyCreator(item.id);
                                setPendingCreators(prev => prev.filter(p => p.id !== item.id));
                              } catch (err) {
                                console.error('Failed to verify:', err);
                              } finally {
                                setProcessingId(null);
                              }
                            }}
                            className={`px-3 py-1.5 bg-brand-blue text-white text-[10px] font-black rounded-lg hover:bg-brand-blue-dark transition-all flex items-center gap-2 ${processingId === item.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {processingId === item.id ? (
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : '✓ Approve'}
                          </button>
                          <button 
                            disabled={!!processingId}
                            onClick={async () => {
                              setProcessingId(item.id);
                              try {
                                await adminApi.deactivateCreator(item.id);
                                setPendingCreators(prev => prev.filter(p => p.id !== item.id));
                              } catch (err) {
                                console.error('Failed to deactivate:', err);
                              } finally {
                                setProcessingId(null);
                              }
                            }}
                            className={`px-3 py-1.5 bg-white border border-rose-100 text-rose-500 text-[10px] font-black rounded-lg hover:bg-rose-50 transition-all flex items-center gap-2 ${processingId === item.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {processingId === item.id ? (
                              <div className="w-3 h-3 border-2 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                            ) : '✕ Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingCreators.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No pending approvals</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dispute Management */}
          <div className="card-premium overflow-hidden">
            <div className="p-5 border-b border-slate-50/50">
              <SectionHeader 
                title="Disputes" 
                subValue={`${dashboard?.open_disputes || 0} Open`} 
                badgeColor="badge-red" 
                icon={AlertCircle}
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Dispute</th>
                    <th>Brand</th>
                    <th>Creator</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dis) => (
                    <tr key={dis.id}>
                      <td className="text-sm font-bold text-slate-700">{dis.reason || 'Late posting'}</td>
                      <td className="text-sm font-black text-slate-900">{dis.brand_name}</td>
                      <td className="text-sm font-black text-slate-900">{dis.creator_name}</td>
                      <td className="text-sm font-black text-slate-900">{formatCurrency(dis.escrow_amount)}</td>
                      <td>
                        <span className={`badge ${dis.status === 'open' ? 'badge-orange' : 'badge-gray'}`}>
                          {dis.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="btn-secondary text-[10px] py-1.5 px-3">
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                  {disputes.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No active disputes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Side Panels */}
        <div className="space-y-4">
          {/* Commission Tracking */}
          <div className="card-premium p-5">
            <SectionHeader title="Commissions" icon={Zap} />
            <div className="space-y-5">
              <MetricRow label="Total Earned" value={formatCurrency(dashboard?.total_volume * 0.1)} valueColor="text-emerald-600" />
              <MetricRow label="This Month" value={formatCurrency(dashboard?.commission_this_month)} />
              <MetricRow label="Avg Rate" value="10%" />
              <MetricRow label="Closed Deals" value={dashboard?.closed_campaigns?.toLocaleString() || '0'} />
              <MetricRow label="Volume" value={formatCurrency(dashboard?.total_volume)} />
            </div>
          </div>

          {/* Platform Stats */}
          <div className="card-premium p-5">
            <SectionHeader title="Security" icon={ShieldAlert} />
            <div className="space-y-5">
              <MetricRow label="Flagged" value={dashboard?.flagged_creators?.toLocaleString() || '0'} valueColor="text-rose-500" />
              <MetricRow label="Verified" value={dashboard?.verified_creators?.toLocaleString() || '0'} valueColor="text-emerald-600" />
              <MetricRow label="Resolved" value={dashboard?.resolved_disputes?.toLocaleString() || '0'} valueColor="text-emerald-600" />
              <MetricRow label="Uptime" value="99.9%" valueColor="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MetricRow = ({ label, value, valueColor }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{label}</span>
    <span className={`text-sm font-black ${valueColor || 'text-slate-900'}`}>{value}</span>
  </div>
);
