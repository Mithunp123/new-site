import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getRequests } from '../../api/creatorApi';
import api from '../../api/axios';
import LottieIcon from '../ui/LottieIcon';
import logoImg from '../../assets/logo.png';

const mainNav = [
  { to: '/dashboard', lottie: 'dashboard',  label: 'Dashboard' },
  { to: '/requests',  lottie: 'inbox',      label: 'Requests', badge: true },
  { to: '/campaigns', lottie: 'briefcase',  label: 'My Campaigns' },
  { to: '/earnings',  lottie: 'money',      label: 'Earnings' },
];

const analyticsNav = [
  { to: '/analytics', lottie: 'chart',   label: 'Analytics' },
  { to: '/leads',     lottie: 'target',  label: 'Leads' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: requestsData } = useQuery({
    queryKey: ['requests', user?.id, 'pending'],
    queryFn: () => getRequests({ status: 'pending' }).then(r => r.data.data),
    refetchOnMount: 'always',
    staleTime: 0,
    enabled: !!user?.id,
  });

  const { data: collabData } = useQuery({
    queryKey: ['creator-active-collabs', user?.id],
    queryFn: () => api.get('/api/creator/campaigns?status=active').then(r => r.data.data),
    refetchOnMount: 'always',
    staleTime: 0,
    enabled: !!user?.id,
  });

  const pendingCount = requestsData?.counts?.pending || 0;
  const hasActiveCollab = (collabData?.campaigns?.length || collabData?.total || 0) > 0;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CR';

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative ${
    isActive
        ? 'bg-blue-600 text-white font-semibold shadow-[0_2px_10px_rgba(37,99,235,0.3)]'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }`;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-4">
          <img src={logoImg} alt="Gradix" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
          <span className="text-[11px] font-semibold text-emerald-700" style={{ fontFamily: 'Inter, sans-serif' }}>Creator</span>
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
                    {item.badge && pendingCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}

            <NavLink to="/chat" className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <LottieIcon name="message" size={18} loop={isActive} />
                  <span className="flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>Messages</span>
                </>
              )}
            </NavLink>
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
            <NavLink to="/settings" className={navLinkClass}>
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
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-[0_2px_6px_rgba(37,99,235,0.3)] flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>{user?.name || 'Creator'}</p>
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
}
