import { Search, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function TopBar({ title }) {
  const { user } = useAuthStore();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PS';

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
      <h1 className="text-lg font-bold font-heading text-slate-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns, brands..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-600 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition font-body placeholder:text-slate-400"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition">
          <Bell size={20} className="text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white"></span>
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full gradient-blue flex items-center justify-center text-white font-bold text-xs font-heading cursor-pointer hover:shadow-md transition">
          {initials}
        </div>
      </div>
    </header>
  );
}
