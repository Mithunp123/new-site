import React from 'react';
import { Bell, Search } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function AdminTopBar() {
  const { user } = useAuthStore();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="relative max-w-xs w-full">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search users, disputes, metrics..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-[#2563EB]/40 focus:ring-2 focus:ring-[#2563EB]/8 transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100 ml-1">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-[13px] font-semibold text-slate-900 leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-slate-400">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
