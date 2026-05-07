import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, Search, Users, BarChart2, 
  TrendingUp, Target, Settings, LogOut,
  Compass, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const BrandSidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { section: 'MAIN', items: [
      { name: 'Dashboard', icon: Home, path: '/brand/dashboard' },
      { name: 'Discover', icon: Compass, path: '/brand/discover' },
      { name: 'Requests', icon: Users, path: '/brand/requests' },
      { name: 'Campaigns', icon: BarChart2, path: '/brand/campaign-tracking' },
    ]},
    { section: 'ANALYTICS', items: [
      { name: 'ROI Analytics', icon: TrendingUp, path: '/brand/roi-analytics' },
      { name: 'Leads', icon: Target, path: '/brand/lead-management' },
    ]},
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
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Brand Mode</span>
          <ChevronRight size={12} className="ml-auto text-slate-500" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto space-y-8 scrollbar-none">
        {menuItems.map((section) => (
          <div key={section.section}>
            <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] px-4 mb-4 uppercase">
              {section.section}
            </p>
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navLinkClass}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-brand-blue' : 'text-slate-400 group-hover:text-white'} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1">{item.name}</span>
                      {isActive && <motion.div layoutId="activeBrandNav" className="absolute left-0 w-1 h-6 bg-brand-blue rounded-r-full" />}
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
            <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue font-black text-sm border border-brand-blue/20">
              {user?.name?.substring(0, 2)?.toUpperCase() || 'NK'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{user?.name || 'Nykaa Beauty'}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">D2C Brand</p>
            </div>
            <button onClick={logout} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default BrandSidebar;
