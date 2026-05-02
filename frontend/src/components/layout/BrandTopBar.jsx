import React from 'react';
import { Bell, User, Search } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function BrandTopBar() {
  const { user } = useAuthStore();

  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search campaigns, creators or analytics..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 ml-auto">
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 font-jakarta">{user?.name || 'Brand Name'}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brand Account</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <User size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
