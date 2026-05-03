import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Inbox, Briefcase, DollarSign,
  BarChart3, Target, Settings, LogOut, CheckCircle2
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: Inbox, label: 'Incoming Requests' },
  { to: '/campaigns', icon: Briefcase, label: 'My Campaigns' },
  { to: '/earnings', icon: DollarSign, label: 'Earnings' },
];

const analyticsNav = [
  { to: '/analytics', icon: BarChart3, label: 'Performance Analytics' },
  { to: '/leads', icon: Target, label: 'Lead Management' },
];

const accountNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PS';

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-slate-100 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center">
            <span className="text-white font-bold text-sm font-heading">G</span>
          </div>
          <span className="text-xl font-extrabold font-heading text-slate-900">Gradix</span>
          <span className="ml-1 text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">v1</span>
        </div>
        <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-xs font-medium text-slate-600">Creator Mode</span>
          <span className="ml-auto text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">Switch</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="mb-6">
          <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Main</span>
          <div className="mt-2 space-y-1">
            {mainNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">3</span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Analytics</span>
          <div className="mt-2 space-y-1">
            {analyticsNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</span>
          <div className="mt-2 space-y-1">
            {accountNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom user card */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-blue flex items-center justify-center text-white font-bold text-sm font-heading">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate font-heading">{user?.name || 'Creator'}</p>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="text-[11px] text-green-600 font-medium">Verified Creator</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
