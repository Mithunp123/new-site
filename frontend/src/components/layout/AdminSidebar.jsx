import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, UserCheck, Trash2, 
  AlertCircle, DollarSign, BarChart2, LogOut,
  ChevronRight, Shield, Settings
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import * as adminApi from '../../api/adminApi';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [counts, setCounts] = React.useState({ approvals: 0, disputes: 0 });

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await adminApi.getAdminDashboard();
        setCounts({
          approvals: res.data.data.pending_verifications,
          disputes: res.data.data.open_disputes
        });
      } catch (err) {
        console.error('Failed to fetch sidebar counts');
      }
    };
    fetchCounts();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      title: 'MODERATION',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { name: 'Creators', icon: Users, path: '/admin/creators' },
        { name: 'Approvals', icon: UserCheck, path: '/admin/verify-creators', badge: counts.approvals },
        { name: 'Fake Check', icon: Trash2, path: '/admin/fake-detection' },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Disputes', icon: AlertCircle, path: '/admin/disputes', badge: counts.disputes },
        { name: 'Payments', icon: DollarSign, path: '/admin/commissions' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Analytics', icon: BarChart2, path: '/admin/analytics' },
        { name: 'Settings', icon: Settings, path: '/admin/settings' },
      ]
    }
  ];

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 group relative ${isActive
      ? 'bg-brand-blue/10 text-brand-blue'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-blue rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/30">
            <span className="text-white font-black text-lg">G</span>
          </div>
          <span className="text-2xl font-black font-heading text-white tracking-tighter">Gradix</span>
        </div>
        <div className="mt-6 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/5 rounded-2xl">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Admin Mode</span>
          <ChevronRight size={12} className="ml-auto text-slate-500" />
        </div>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto space-y-8 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] px-4 mb-4 uppercase">
              {group.title}
            </p>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navLinkClass}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-white'} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1">{item.name}</span>
                      {item.badge > 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${isActive ? 'bg-brand-blue text-white' : 'bg-rose-500/20 text-rose-500'}`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <motion.div layoutId="activeAdminNav" className="absolute left-0 w-1 h-6 bg-brand-blue rounded-r-full" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile */}
      <div className="p-4 mt-auto">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black text-xs uppercase border border-white/10">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">System Admin</p>
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
