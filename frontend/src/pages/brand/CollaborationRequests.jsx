import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Clock, CheckCircle2, XCircle, Send, ArrowUpRight, Search, Filter } from 'lucide-react';
import { formatINR } from '../../utils/format';

const CollaborationRequests = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['brand-requests'],
    queryFn: async () => {
      const res = await api.get('/api/brand/collaboration/requests');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse font-dm">
        <div className="h-10 w-64 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 bg-gray-100 rounded-3xl" />
          <div className="h-24 bg-gray-100 rounded-3xl" />
          <div className="h-24 bg-gray-100 rounded-3xl" />
        </div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-100 rounded-3xl" />
          <div className="h-20 bg-gray-100 rounded-3xl" />
          <div className="h-20 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100 flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Accepted</span>;
      case 'declined': return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 flex items-center justify-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> Declined</span>;
      case 'pending': return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 flex items-center justify-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Pending</span>;
      case 'sent':
      default:
        return <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold border border-orange-100 flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5"/> Sent</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-dm">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 font-jakarta">Collaboration Requests</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your sent proposals and creator responses.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search requests..." 
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Sent Requests" value={data?.sent_count || 0} icon={Send} color="orange" />
        <StatCard label="Pending Approval" value={data?.pending_count || 0} icon={Clock} color="blue" />
        <StatCard label="Accepted Collabs" value={data?.accepted_count || 0} icon={CheckCircle2} color="green" />
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 font-jakarta">All Requests</h2>
        </div>
        
        {data?.requests?.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">No requests sent yet</p>
              <p className="text-sm text-gray-500 font-medium">Head over to the discovery page to find creators and send collaboration requests.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.requests?.map((req) => (
              <div key={req.campaign_id} className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors group">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: req.avatar_color }}>
                    {req.creator_initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[15px] group-hover:text-blue-600 transition-colors">{req.creator_name}</h3>
                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">{req.campaign_title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Offer Amount</p>
                    <p className="font-bold text-gray-900">{formatINR(req.amount)}</p>
                  </div>
                  <div className="w-28 flex justify-end">
                    {getStatusBadge(req.status)}
                  </div>
                  <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100">
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100/50',
    blue: 'bg-blue-50 text-blue-600 border-blue-100/50',
    green: 'bg-green-50 text-green-600 border-green-100/50',
  };
  
  return (
    <div className={`bg-white border rounded-3xl p-6 shadow-sm flex items-center gap-5 ${colors[color].split(' ')[2]}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color].split(' ').slice(0,2).join(' ')}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-gray-900 font-jakarta leading-none">{value}</p>
      </div>
    </div>
  );
};

export default CollaborationRequests;
