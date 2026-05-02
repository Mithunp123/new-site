import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building2, Zap, TrendingUp, 
  FileText, CheckCircle, XCircle, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Search,
  MoreVertical
} from 'lucide-react';
import * as adminApi from "../api/adminApi";

const StatCard = ({ label, value, subText, subValue, icon: Icon, isBlue }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl p-6 border border-gray-100 shadow-sm ${isBlue ? 'bg-[#2563EB] text-white shadow-blue-100 shadow-lg' : 'bg-white text-slate-900'}`}
  >
    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isBlue ? 'text-blue-100' : 'text-gray-400'}`}>{label}</p>
    <div className="flex items-end justify-between">
      <div>
        <h3 className="text-2xl font-black font-jakarta">{value}</h3>
        {subValue && (
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] font-bold ${isBlue ? 'text-blue-100' : 'text-green-600'}`}>{subValue}</span>
            <span className={`text-[10px] font-medium ${isBlue ? 'text-blue-200' : 'text-gray-400'}`}>{subText}</span>
          </div>
        )}
      </div>
      {Icon && !isBlue && <Icon size={24} className="text-gray-200" />}
    </div>
  </motion.div>
);

const SectionHeader = ({ title, subValue, badgeColor }) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
       {title}
    </h2>
    {subValue && (
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, creatorsRes, disputesRes] = await Promise.all([
          adminApi.getAdminDashboard(),
          adminApi.getCreators({ status: 'unverified', limit: 4 }),
          adminApi.getDisputes({ status: 'open', limit: 3 })
        ]);
        
        setDashboard(dashRes.data.data);
        setPendingCreators(creatorsRes.data.creators || []);
        setDisputes(disputesRes.data || []);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 font-jakarta tracking-tight">Admin Control Panel</h1>
          <p className="text-gray-500 font-medium mt-1">Platform-wide monitoring and moderation</p>
        </div>
        <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm flex items-center gap-2">
          Generate Report
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          label="Total Users" 
          value={(dashboard?.total_creators + dashboard?.total_brands).toLocaleString()} 
          subValue={dashboard?.new_creators_this_month + dashboard?.new_brands_this_month > 0 ? `+${dashboard.new_creators_this_month + dashboard.new_brands_this_month}` : '0'} 
          subText="new"
        />
        <StatCard 
          label="Active Creators" 
          value={dashboard?.total_creators?.toLocaleString() || '0'} 
          subValue={dashboard?.new_creators_this_month > 0 ? `+${dashboard.new_creators_this_month}` : '0'} 
          subText="new"
        />
        <StatCard 
          label="Active Brands" 
          value={dashboard?.total_brands?.toLocaleString() || '0'} 
          subValue={dashboard?.new_brands_this_month > 0 ? `+${dashboard.new_brands_this_month}` : '0'} 
          subText="new"
        />
        <StatCard 
          label="MRR" 
          value={formatCurrency(dashboard?.commission_this_month)} 
          subValue={dashboard?.commission_this_month > 0 ? 'Live' : '0'} 
          isBlue
        />
        <StatCard 
          label="Active Campaigns" 
          value={dashboard?.active_campaigns || 0} 
          subText="Across all brands"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Tables */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Approval Queue */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <SectionHeader title="Profile Approval Queue" subValue={`${dashboard?.pending_verifications || 0} Pending`} badgeColor="bg-orange-50 text-orange-600" />
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase border-b border-gray-50">
                    <th className="pb-4">Name</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Platform</th>
                    <th className="pb-4">Followers</th>
                    <th className="pb-4">Submitted</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingCreators.map((item) => (
                    <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-5">
                        <span className="text-sm font-bold text-gray-900">{item.name}</span>
                      </td>
                      <td className="py-5">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full uppercase">Creator</span>
                      </td>
                      <td className="py-5">
                        <span className="text-xs text-gray-500 font-medium">{item.category || 'Niche'}</span>
                      </td>
                      <td className="py-5">
                        <span className="text-xs text-gray-500 font-bold">{item.followers_count?.toLocaleString() || '0'}</span>
                      </td>
                      <td className="py-5">
                        <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 bg-[#2563EB] text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-all">
                            ✓ Approve
                          </button>
                          <button className="px-3 py-1.5 bg-white border border-red-100 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-50 transition-all">
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingCreators.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-gray-400 text-sm">No pending approvals</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dispute Management */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <SectionHeader title="Dispute Management" subValue={`${dashboard?.open_disputes || 0} Open`} badgeColor="bg-red-50 text-red-600" />
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-gray-400 tracking-widest uppercase border-b border-gray-50">
                    <th className="pb-4">Dispute</th>
                    <th className="pb-4">Brand</th>
                    <th className="pb-4">Creator</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {disputes.map((dis) => (
                    <tr key={dis.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-5 text-sm font-medium text-gray-700">{dis.reason || 'Late posting'}</td>
                      <td className="py-5 text-sm font-bold text-gray-900">{dis.brand_name}</td>
                      <td className="py-5 text-sm font-bold text-gray-900">{dis.creator_name}</td>
                      <td className="py-5 text-sm font-bold text-gray-900">{formatCurrency(dis.escrow_amount)}</td>
                      <td className="py-5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${dis.status === 'open' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                          {dis.status}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <button className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition-all">
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                  {disputes.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-gray-400 text-sm">No active disputes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Side Panels */}
        <div className="space-y-8">
          {/* Commission Tracking */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <SectionHeader title="Commission Tracking" />
            <div className="space-y-5">
              <MetricRow label="Total Commissions Earned" value={formatCurrency(dashboard?.total_volume * 0.1)} valueColor="text-green-600" />
              <MetricRow label="This Month" value={formatCurrency(dashboard?.commission_this_month)} />
              <MetricRow label="Avg Commission Rate" value="10%" />
              <MetricRow label="Total Campaigns Closed" value={dashboard?.closed_campaigns?.toLocaleString() || '0'} />
              <MetricRow label="Total Escrow Processed" value={formatCurrency(dashboard?.total_volume)} />
            </div>
          </div>

          {/* Platform Stats */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <SectionHeader title="Platform Stats" />
            <div className="space-y-5">
              <MetricRow label="Fake Creators Removed" value={dashboard?.flagged_creators?.toLocaleString() || '0'} valueColor="text-red-500" />
              <MetricRow label="Profiles Verified" value={dashboard?.verified_creators?.toLocaleString() || '0'} valueColor="text-green-600" />
              <MetricRow label="Disputes Resolved" value={dashboard?.resolved_disputes?.toLocaleString() || '0'} valueColor="text-green-600" />
              <MetricRow label="Platform Uptime" value="99.9%" valueColor="text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MetricRow = ({ label, value, valueColor }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm font-medium text-gray-400">{label}</span>
    <span className={`text-sm font-black ${valueColor || 'text-gray-900'}`}>{value}</span>
  </div>
);
