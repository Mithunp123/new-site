import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Inbox, Briefcase, DollarSign,
  BarChart3, Target, Settings, LogOut, CheckCircle2, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getRequests } from '../../api/creatorApi';

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: Inbox, label: 'Requests', badge: true },
  { to: '/campaigns', icon: Briefcase, label: 'My Campaigns' },
  { to: '/earnings', icon: DollarSign, label: 'Earnings' },
];

const analyticsNav = [
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/leads', icon: Target, label: 'Leads' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['requests', 'pending'],
    queryFn: () => getRequests({ status: 'pending' }).then(r => r.data.data),
    enabled: !!user
  });

  const pendingCount = data?.counts?.pending || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 group relative ${isActive
      ? 'bg-brand-blue/10 text-brand-blue shadow-lg shadow-brand-blue/5'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PS';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-blue flex items-center justify-center shadow-lg shadow-brand-blue/30">
            <span className="text-white font-black text-lg">G</span>
          </div>
          <span className="text-2xl font-black font-heading text-white tracking-tighter">Gradix</span>
        </div>
        <div className="mt-6 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/5 rounded-2xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Creator Mode</span>
          <ChevronRight size={12} className="ml-auto text-slate-500" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto space-y-8 scrollbar-none">
        <div>
          <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Main Menu</span>
          <div className="mt-4 space-y-1.5">
            {mainNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-white'} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && pendingCount > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20">
                        {pendingCount}
                      </span>
                    )}
                    {isActive && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-brand-blue rounded-r-full" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Analytics</span>
          <div className="mt-4 space-y-1.5">
            {analyticsNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-white'} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-brand-blue rounded-r-full" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom user card */}
      <div className="p-4 mt-auto">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white font-black text-sm shadow-lg shadow-brand-blue/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{user?.name || 'Creator'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={10} className="text-emerald-500" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Verified</span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
