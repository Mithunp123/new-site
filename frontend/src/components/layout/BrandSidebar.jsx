import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Search, Users, BarChart2, 
  TrendingUp, Target, Settings, LogOut,
  Compass
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const BrandSidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { section: 'MAIN', items: [
      { name: 'Dashboard', icon: Home, path: '/brand/dashboard' },
      { name: 'Discover Creators', icon: Compass, path: '/brand/discover' },
      { name: 'Collaboration Requests', icon: Users, path: '/brand/requests' },
      { name: 'Campaign Tracking', icon: BarChart2, path: '/brand/campaign-tracking' },
    ]},
    { section: 'ANALYTICS', items: [
      { name: 'ROI Analytics', icon: TrendingUp, path: '/brand/roi-analytics' },
      { name: 'Lead Management', icon: Target, path: '/brand/lead-management' },
    ]},
    { section: 'ACCOUNT', items: [
      { name: 'Settings', icon: Settings, path: '/brand/settings' },
    ]}
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <span className="text-2xl font-extrabold text-blue-600 tracking-tight font-jakarta">Gradix</span>
        </div>
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF1F0] text-[#EF4444] border border-[#FCA5A5]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mr-1.5 animate-pulse"></span>
          Brand Mode
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-8">
        {menuItems.map((section) => (
          <div key={section.section}>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest px-3 mb-2 uppercase">
              {section.section}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 font-semibold' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon className={`w-5 h-5 transition-colors`} />
                  <span className="text-sm font-dm">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
            {user?.name?.substring(0, 2).toUpperCase() || 'NK'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate font-jakarta">{user?.name || 'Nykaa Beauty'}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">D2C Brand</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-dm font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default BrandSidebar;
