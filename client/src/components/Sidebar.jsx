import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Bed, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  UserCheck, 
  BarChart3, 
  LogOut,
  Sparkles,
  BookOpen
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const isAdmin = user && user.role === 'admin';

  const adminLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Rooms', path: '/rooms', icon: Bed },
    { name: 'Tenants', path: '/tenants', icon: Users },
    { name: 'Rent Tracking', path: '/rent', icon: CreditCard },
    { name: 'Complaints', path: '/complaints', icon: AlertTriangle },
    { name: 'Visitor Log', path: '/visitors', icon: UserCheck },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'PG Policies', path: '/policies', icon: BookOpen }
  ];

  const tenantLinks = [
    { name: 'My Room', path: '/dashboard', icon: Bed },
    { name: 'My Rent Bills', path: '/rent', icon: CreditCard },
    { name: 'My Complaints', path: '/complaints', icon: AlertTriangle },
    { name: 'My Visitors', path: '/visitors', icon: UserCheck },
    { name: 'PG Policies', path: '/policies', icon: BookOpen }
  ];

  const links = isAdmin ? adminLinks : tenantLinks;

  const activeStyle = "flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all duration-200 font-medium";
  const inactiveStyle = "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all duration-200";

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-transform duration-300 transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="p-1.5 rounded-lg bg-violet-600 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              CoolStay
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest -mt-1">
              PG Management
            </p>
          </div>
        </div>

        {/* User Info Capsule */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center font-bold text-violet-700 dark:text-violet-300">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">{user?.name}</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink 
                key={link.name} 
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-medium transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
