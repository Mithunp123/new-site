import React from 'react';
import { Bell, Search, ChevronDown, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function BrandTopBar() {
  const { user } = useAuthStore();

  return (
    <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search campaigns, creators or analytics..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border border-transparent rounded-2xl text-[13px] font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-brand-blue/20 focus:ring-4 focus:ring-brand-blue/5 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2.5 bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-brand-blue rounded-xl transition-all shadow-sm">
          <Bell size={20} strokeWidth={2.5} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-100 h-8">
          <div className="text-right hidden md:block">
            <p className="text-[12px] font-black text-slate-900 leading-none">{user?.name || 'Brand Name'}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">Brand Account</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-black text-xs shadow-lg shadow-brand-blue/20 cursor-pointer hover:scale-105 transition-transform">
            <User size={20} />
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </div>
  );
}
