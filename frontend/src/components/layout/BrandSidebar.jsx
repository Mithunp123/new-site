import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import LottieIcon from '../ui/LottieIcon';
import logoImg from '../../assets/logo.png';

const mainNav = [
  { to: '/brand/dashboard',         lottie: 'dashboard',  label: 'Dashboard' },
  { to: '/brand/discover',          lottie: 'compass',    label: 'Discover' },
  { to: '/brand/requests',          lottie: 'inbox',      label: 'Requests' },
  { to: '/brand/campaign-tracking', lottie: 'briefcase',  label: 'Campaigns' },
];

const analyticsNav = [
  { to: '/brand/roi-analytics',   lottie: 'trending', label: 'ROI Analytics' },
  { to: '/brand/lead-management', lottie: 'target',   label: 'Leads' },
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

  // Brand uses purple active state
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative ${
      isActive
        ? 'bg-[#7C3AED] text-white font-semibold shadow-[0_2px_8px_rgba(124,58,237,0.3)]'
        : 'text-slate-500 hover:bg-purple-50 hover:text-purple-800'
    }`;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-4">
          <img src={logoImg} alt="Gradix" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] shadow-[0_0_6px_rgba(124,58,237,0.5)]"></span>
          <span className="text-[11px] font-semibold text-[#7C3AED]" style={{ fontFamily: 'Inter, sans-serif' }}>Brand Account</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>Main</p>
          <div className="space-y-0.5">
            {mainNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <LottieIcon name={item.lottie} size={18} loop={isActive} />
                    <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Chat — enabled only with active collab */}
            {hasActiveCollab ? (
              <NavLink to="/brand/chat" className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <LottieIcon name="message" size={18} loop={isActive} />
                    <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>Messages</span>
                  </>
                )}
              </NavLink>
            ) : (
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-300 cursor-not-allowed select-none"
                title="Available after campaign connection"
              >
                <LottieIcon name="message" size={18} />
                <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>Messages</span>
                <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md font-semibold">Soon</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>Analytics</p>
          <div className="space-y-0.5">
            {analyticsNav.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <LottieIcon name={item.lottie} size={18} loop={isActive} />
                    <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>Account</p>
          <div className="space-y-0.5">
            <NavLink to="/brand/settings" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <LottieIcon name="settings" size={18} loop={isActive} />
                  <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>Settings</span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-all">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white font-bold text-xs shadow-[0_2px_6px_rgba(124,58,237,0.3)] flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>{user?.name || 'Brand'}</p>
            <p className="text-[11px] text-slate-400 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{user?.email || ''}</p>
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
};

export default BrandSidebar;
