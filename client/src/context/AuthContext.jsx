import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Handle toast triggers
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Sync theme to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Verify token on mount/load
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.success) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Verify user token failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        return { success: true, role: data.user.role };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  // Guest Login handler
  const guestLogin = async () => {
    try {
      const res = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast(`Logged in as Anonymous Guest!`, 'success');
        return { success: true, role: data.user.role };
      } else {
        return { success: false, message: data.message || 'Guest login failed' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  // Theme switcher
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toast,
        login,
        guestLogin,
        logout,
        toggleTheme,
        showToast
      }}
    >
      {children}
      
      {/* Dynamic Toast Element */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 max-w-sm p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 border glass-panel animate-bounce">
          <div className={`w-3 h-3 rounded-full shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
            toast.type === 'error' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 
            'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
          }`} />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {toast.message}
          </p>
        </div>
      )}
    </AuthContext.Provider>
  );
};
