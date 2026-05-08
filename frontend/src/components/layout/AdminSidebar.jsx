import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import * as adminApi from '../../api/adminApi';
import LottieIcon from '../ui/LottieIcon';
import logoImg from '../../assets/logo.png';

const navGroups = [
  {
    title: 'Moderation',
    items: [
      { name: 'Dashboard',  lottie: 'dashboard', path: '/admin/dashboard' },
      { name: 'Creators',   lottie: 'users',     path: '/admin/creators' },
      { name: 'Approvals',  lottie: 'shield',    path: '/admin/verify-creators', badgeKey: 'approvals' },
      { name: 'Fake Check', lottie: 'alert',     path: '/admin/fake-detection' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Disputes', lottie: 'alert',  path: '/admin/disputes', badgeKey: 'disputes' },
      { name: 'Payments', lottie: 'money',  path: '/admin/commissions' },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Analytics', lottie: 'chart',    path: '/admin/analytics' },
      { name: 'Settings',  lottie: 'settings', path: '/admin/settings' },
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
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-4">
          <img src={logoImg} alt="Gradix" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
          <span className="text-[11px] font-semibold text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const badge = item.badgeKey ? counts[item.badgeKey] : 0;
                return (
                  <NavLink key={item.path} to={item.path} className={navLinkClass}>
                    {({ isActive }) => (
                      <>
                        <LottieIcon
                          name={item.lottie}
                          size={18}
                          loop={isActive}
                          className={isActive ? '[&_path]:stroke-white [&_rect]:fill-white' : ''}
                        />
                        <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{item.name}</span>
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
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-slate-400 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>Super Admin</p>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
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
