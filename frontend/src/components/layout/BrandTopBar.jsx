import React from 'react';
import { Bell, Search } from 'lucide-react';
import SessionManager from '../ui/SessionManager';

export default function BrandTopBar() {
  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="relative max-w-xs w-full">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search campaigns, creators..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-[#7C3AED]/40 transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <SessionManager accentColor="#7C3AED" />
      </div>
    </header>
  );
}
