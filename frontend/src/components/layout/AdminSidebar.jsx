import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserCheck, Trash2, 
  AlertCircle, DollarSign, BarChart2, LogOut,
  ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/logo.png';

export default function AdminSidebar() {
  const location = useLocation();
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

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navGroups = [
    {
      title: 'MODERATION',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { name: 'Users', icon: Users, path: '/admin/creators' },
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
      title: 'REPORTS',
      items: [
        { name: 'Analytics', icon: BarChart2, path: '/admin/analytics' },
        { name: 'Logout', icon: LogOut, path: '#', onClick: handleLogout },
      ]
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-white flex flex-col border-r border-gray-100 shadow-sm">
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Gradix" className="h-8" />
        </div>
        <span className="bg-blue-50 text-[10px] font-bold px-2 py-0.5 rounded text-blue-600 uppercase tracking-wider">Admin</span>
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        {/* Admin Panel Badge */}
        <div className="bg-white border border-gray-100 rounded-xl p-3 mb-8 flex items-center gap-3 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-sm font-bold text-gray-700">Admin Panel</span>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-8">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.1em] mb-4 px-4 uppercase">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  const Content = (
                    <div
                      onClick={item.onClick}
                      className={`
                        group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                        ${active 
                          ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-100' 
                          : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-[#2563EB]'} />
                        <span className="text-sm font-bold">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`
                          text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${active ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );

                  return item.path === '#' ? (
                    <div key={item.name}>{Content}</div>
                  ) : (
                    <Link to={item.path} key={item.path}>
                      {Content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs uppercase">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              {user?.role?.replace('_', ' ') || 'Platform Admin'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
