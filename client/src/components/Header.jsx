import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, User, Bell, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const { theme, toggleTheme, user, token } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchComplaints = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await fetch('/api/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // filter for pending status complaints
        const pending = data.data.filter(c => c.status === 'pending');
        setNotifications(pending);
      }
    } catch (err) {
      console.error('Error fetching complaints for header:', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // Poll for new complaints every 20 seconds
    const interval = setInterval(fetchComplaints, 20000);
    return () => clearInterval(interval);
  }, [user, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors duration-200">
      {/* Mobile Sidebar Trigger & Greeting */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Welcome back, <span className="text-violet-600 dark:text-violet-400 font-bold">{user?.name}</span> 👋
          </h2>
          <p className="text-xs text-slate-400 font-medium">Have a productive day monitoring CoolStay.</p>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Bell Icon Notification Center (Admin Only) */}
        {user?.role === 'admin' && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-350 transition-all cursor-pointer relative"
              title="Complaints Notifications"
            >
              <Bell className={`w-4.5 h-4.5 ${notifications.length > 0 ? 'text-violet-500 animate-pulse' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-[0_0_8px_#f43f5e]">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xl p-4 z-55 animate-fade-in space-y-3 text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending complaints</span>
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full">
                    {notifications.length} New
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center font-medium">No new complaints filed.</p>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n._id}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/complaints');
                        }}
                        className="py-2.5 hover:bg-slate-50 dark:hover:bg-slate-950/20 rounded-lg px-2 cursor-pointer transition-colors flex items-start gap-2.5 text-xs text-left"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-grow">
                          <p className="font-bold text-slate-750 dark:text-slate-200">
                            {n.isAnonymous ? `Anonymous (Room ${n.roomNumber})` : (n.tenant?.name || 'Resident')}
                          </p>
                          <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">{n.category}</p>
                          <p className="text-slate-400 truncate mt-0.5">{n.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/complaints');
                  }}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center block"
                >
                  View All Complaints
                </button>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-350 transition-all cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-indigo-600" />
          )}
        </button>

        {/* Profile Card Summary */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8.5 h-8.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-350">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
