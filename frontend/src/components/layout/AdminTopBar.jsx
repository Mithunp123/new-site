import React from 'react';
import { Bell, Search, Settings } from 'lucide-react';

export default function AdminTopBar() {
  return (
    <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10">
      <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>

      <div className="flex items-center gap-6">
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" size={18} />
          <input
            type="text"
            placeholder="Search users, campaigns..."
            className="w-full pl-11 pr-4 py-2.5 bg-[#F1F5F9] border-none text-gray-700 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
          <button className="relative p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=FFEDD5&color=F97316" alt="Avatar" />
          </div>
        </div>
      </div>
    </div>
  );
}
