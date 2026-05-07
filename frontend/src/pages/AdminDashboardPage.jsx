import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Zap, TrendingUp, ShieldAlert, AlertCircle, Shield } from 'lucide-react';
import * as adminApi from '../api/adminApi';
import { formatCount } from '../utils/format';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard]           = useState(null);
  const [loading, setLoading]               = useState(true);
  const [pendingCreators, setPendingCreators] = useState([]);
  const [disputes, setDisputes]             = useState([]);
  const [processingId, setProcessingId]     = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, creatorsRes, disputesRes] = await Promise.all([
          adminApi.getAdminDashboard(),
          adminApi.getCreators({ status: 'unverified', limit: 4 }),
          adminApi.getDisputes({ status: 'open', limit: 3 }),
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

  const fmtCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-8 w-56 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-80 bg-slate-100 rounded-2xl" />
          <div className="h-80 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform-wide monitoring and moderation</p>
        </div>
        <button className="btn-secondary">Generate Report</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users"   value={((dashboard?.total_creators || 0) + (dashboard?.total_brands || 0)).toLocaleString()} changeLabel="Platform total"                                                icon={Users}     index={0} />
        <StatCard label="Creators"      value={dashboard?.total_creators?.toLocaleString() || '0'}                                    change={dashboard?.new_creators_this_month} changeLabel="New this month" icon={Users}     index={1} />
        <StatCard label="Brands"        value={dashboard?.total_brands?.toLocaleString() || '0'}                                      change={dashboard?.new_brands_this_month}   changeLabel="New this month" icon={Building2} index={2} />
        <StatCard label="Commissions"   value={fmtCurrency(dashboard?.commission_this_month)}                                         changeLabel="This month"                                                 icon={Zap}       variant="blue" index={3} />
        <StatCard label="Campaigns"     value={dashboard?.active_campaigns || 0}                                                      changeLabel="Across platform"                                            icon={TrendingUp} index={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — Tables */}
        <div className="lg:col-span-2 space-y-5">

          {/* Approval Queue */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield size={17} className="text-[#2563EB]" />
                <h2 className="section-title">Approval Queue</h2>
              </div>
              <span className="badge badge-orange">{dashboard?.pending_verifications || 0} Pending</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Reach</th>
                    <th>Submitted</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCreators.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center font-bold text-[#2563EB] text-xs flex-shrink-0">
                            {item.name?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.platforms?.map(p => (
                                <span key={p} className="text-[10px] font-medium text-slate-400 uppercase">{p}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue">{item.category || 'Niche'}</span>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {item.instagram_followers > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-pink-500">IG</span>
                              <span className="text-xs font-medium text-slate-700">{formatCount(Number(item.instagram_followers))}</span>
                            </div>
                          )}
                          {item.youtube_followers > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-red-500">YT</span>
                              <span className="text-xs font-medium text-slate-700">{formatCount(Number(item.youtube_followers))}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-slate-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={!!processingId}
                            onClick={async () => {
                              setProcessingId(item.id);
                              try { await adminApi.verifyCreator(item.id); setPendingCreators(prev => prev.filter(p => p.id !== item.id)); }
                              catch (err) { console.error(err); }
                              finally { setProcessingId(null); }
                            }}
                            className={`btn-primary text-xs py-1.5 px-3 ${processingId === item.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {processingId === item.id ? '...' : '✓ Approve'}
                          </button>
                          <button
                            disabled={!!processingId}
                            onClick={async () => {
                              setProcessingId(item.id);
                              try { await adminApi.deactivateCreator(item.id); setPendingCreators(prev => prev.filter(p => p.id !== item.id)); }
                              catch (err) { console.error(err); }
                              finally { setProcessingId(null); }
                            }}
                            className="btn-secondary text-xs py-1.5 px-3 text-red-500 border-red-100 hover:bg-red-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingCreators.length === 0 && (
                    <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No pending approvals</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disputes */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle size={17} className="text-red-500" />
                <h2 className="section-title">Disputes</h2>
              </div>
              <span className="badge badge-red">{dashboard?.open_disputes || 0} Open</span>
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
                  {disputes.map(dis => (
                    <tr key={dis.id}>
                      <td className="font-medium text-slate-700">{dis.reason || 'Late posting'}</td>
                      <td className="font-medium text-slate-900">{dis.brand_name}</td>
                      <td className="font-medium text-slate-900">{dis.creator_name}</td>
                      <td className="font-semibold text-slate-900">{fmtCurrency(dis.escrow_amount)}</td>
                      <td><Badge status={dis.status} /></td>
                      <td className="text-right">
                        <button className="btn-secondary text-xs py-1.5 px-3">Resolve</button>
                      </td>
                    </tr>
                  ))}
                  {disputes.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No active disputes</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right — Side panels */}
        <div className="space-y-5">

          {/* Commissions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-[#2563EB]" />
              <h2 className="section-title">Commissions</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Total Earned',  value: fmtCurrency(dashboard?.total_volume * 0.1), color: 'text-emerald-600' },
                { label: 'This Month',    value: fmtCurrency(dashboard?.commission_this_month) },
                { label: 'Avg Rate',      value: '10%' },
                { label: 'Closed Deals',  value: dashboard?.closed_campaigns?.toLocaleString() || '0' },
                { label: 'Total Volume',  value: fmtCurrency(dashboard?.total_volume) },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-500">{m.label}</span>
                  <span className={`text-sm font-semibold ${m.color || 'text-slate-900'}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={16} className="text-slate-700" />
              <h2 className="section-title">Security</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Flagged',   value: dashboard?.flagged_creators?.toLocaleString() || '0',  color: 'text-red-500' },
                { label: 'Verified',  value: dashboard?.verified_creators?.toLocaleString() || '0', color: 'text-emerald-600' },
                { label: 'Resolved',  value: dashboard?.resolved_disputes?.toLocaleString() || '0', color: 'text-emerald-600' },
                { label: 'Uptime',    value: '99.9%',                                               color: 'text-emerald-600' },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-500">{m.label}</span>
                  <span className={`text-sm font-semibold ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
