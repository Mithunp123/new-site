import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, ShieldAlert,
  AlertCircle, DollarSign, BarChart2, LogOut, Settings,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import * as adminApi from '../../api/adminApi';

const navGroups = [
  {
    title: 'Moderation',
    items: [
      { name: 'Dashboard',  icon: LayoutDashboard, path: '/admin/dashboard' },
      { name: 'Creators',   icon: Users,           path: '/admin/creators' },
      { name: 'Approvals',  icon: UserCheck,       path: '/admin/verify-creators', badgeKey: 'approvals' },
      { name: 'Fake Check', icon: ShieldAlert,     path: '/admin/fake-detection' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Disputes', icon: AlertCircle, path: '/admin/disputes', badgeKey: 'disputes' },
      { name: 'Payments', icon: DollarSign,  path: '/admin/commissions' },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Analytics', icon: BarChart2, path: '/admin/analytics' },
      { name: 'Settings',  icon: Settings,  path: '/admin/settings' },
    ],
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [counts, setCounts] = React.useState({ approvals: 0, disputes: 0 });

  React.useEffect(() => {
    adminApi.getAdminDashboard()
      .then(res => setCounts({
        approvals: res.data.data.pending_verifications || 0,
        disputes:  res.data.data.open_disputes || 0,
      }))
      .catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative ${
      isActive
        ? 'bg-[#2563EB] text-white font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }`;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.35)]">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-[17px] font-bold text-slate-900 tracking-tight">Gradix</span>
        </div>
        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
          <span className="text-[11px] font-semibold text-slate-600">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const badge = item.badgeKey ? counts[item.badgeKey] : 0;
                return (
                  <NavLink key={item.path} to={item.path} className={navLinkClass}>
                    {({ isActive }) => (
                      <>
                        <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="flex-1">{item.name}</span>
                        {badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-slate-400 truncate">Super Admin</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
