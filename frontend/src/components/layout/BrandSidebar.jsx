import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Compass, Users, BarChart2,
  TrendingUp, Target, Settings, LogOut, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const mainNav = [
  { to: '/brand/dashboard',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/brand/discover',           icon: Compass,         label: 'Discover' },
  { to: '/brand/requests',           icon: Users,           label: 'Requests' },
  { to: '/brand/campaign-tracking',  icon: BarChart2,       label: 'Campaigns' },
];

const analyticsNav = [
  { to: '/brand/roi-analytics',    icon: TrendingUp, label: 'ROI Analytics' },
  { to: '/brand/lead-management',  icon: Target,     label: 'Leads' },
];

const BrandSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: collabData } = useQuery({
    queryKey: ['brand-active-collabs'],
    queryFn: () => api.get('/api/brand/campaigns?status=active').then(r => r.data.data),
    enabled: !!user,
  });

  const hasActiveCollab = (collabData?.campaigns?.length || collabData?.total || 0) > 0;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'BR';

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
        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shadow-[0_0_6px_rgba(37,99,235,0.5)]"></span>
          <span className="text-[11px] font-semibold text-[#2563EB]">Brand</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Main</p>
          <div className="space-y-0.5">
            {mainNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Chat nav item — enabled only with active collab */}
            {hasActiveCollab ? (
              <NavLink to="/brand/chat" className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <MessageSquare size={16} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1">Messages</span>
                  </>
                )}
              </NavLink>
            ) : (
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-300 cursor-not-allowed select-none"
                title="Available after campaign connection"
              >
                <MessageSquare size={16} strokeWidth={2} />
                <span className="flex-1">Messages</span>
                <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md font-semibold">Soon</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Analytics</p>
          <div className="space-y-0.5">
            {analyticsNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Account</p>
          <div className="space-y-0.5">
            <NavLink to="/brand/settings" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <Settings size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="flex-1">Settings</span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs shadow-[0_2px_6px_rgba(37,99,235,0.3)]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user?.name || 'Brand'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
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
};

export default BrandSidebar;
