import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { KeyRound, Mail, Sparkles, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const { login, guestLogin, token, user, showToast } = useAuth();
  
  // Navigation Guard: Redirect if already logged in
  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const [mode, setMode] = useState('register'); // 'register' | 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot / Reset states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Anonymous Complaint states
  const [roomNumber, setRoomNumber] = useState('');
  const [category, setCategory] = useState('WiFi');
  const [description, setDescription] = useState('');

  // Self-Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmergencyContact, setRegEmergencyContact] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  // Submit Forgot Password
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        setInfoMsg('Simulated email reset link triggered! Reset token logged to server console.');
        // Preset token for demo convenience
        setResetToken(data.token);
        // Switch to reset mode after 2s so they can demo password reset immediately
        setTimeout(() => {
          setMode('reset');
          setInfoMsg('');
        }, 3000);
      } else {
        setErrorMsg(data.message);
      }
    } catch (err) {
      setErrorMsg('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setErrorMsg('Please enter both token and new password');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast('Password reset successful! Please log in.', 'success');
        setMode('login');
        setPassword('');
        setErrorMsg('');
      } else {
        setErrorMsg(data.message);
      }
    } catch (err) {
      setErrorMsg('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit Anonymous Complaint
  const handleAnonymousComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!roomNumber || !description) {
      setErrorMsg('Please enter room number and complaint description');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/complaints/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, roomNumber })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Anonymous complaint logged successfully!', 'success');
        setInfoMsg(`Complaint registered! Our team will inspect Room ${roomNumber}.`);
        setRoomNumber('');
        setDescription('');
        setTimeout(() => {
          setMode('login');
          setInfoMsg('');
        }, 3000);
      } else {
        setErrorMsg(data.message || 'Submission failed');
      }
    } catch (err) {
      setErrorMsg('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regEmergencyContact || !regPassword) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          emergencyContact: regEmergencyContact
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Account registered successfully!', 'success');
        setInfoMsg(data.message || 'Registration successful! Please log in.');
        
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegEmergencyContact('');
        setRegPassword('');

        setTimeout(() => {
          setMode('login');
          setInfoMsg('');
        }, 2500);
      } else {
        setErrorMsg(data.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            Welcome to CoolStay
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            PG & HOSTEL MANAGEMENT PORTAL
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-medium animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Global Info Banner */}
        {infoMsg && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-amber-400 animate-spin" />
              <span>{infoMsg}</span>
            </div>
          </div>
        )}

        {/* MODE 1: Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@coolstay.com or tenant@coolstay.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-all cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('anonymous-complaint'); setErrorMsg(''); setInfoMsg(''); }}
              className="text-xs font-semibold text-slate-450 hover:text-white transition-all cursor-pointer block mt-4 text-center w-full"
            >
              Raise Anonymous Room Complaint
            </button>

            <div className="text-center mt-6 pt-4 border-t border-white/5 text-xs text-slate-400">
              New Resident?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); setInfoMsg(''); }}
                className="font-bold text-violet-400 hover:underline cursor-pointer"
              >
                Sign Up Here
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: Forgot Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter the email address registered with CoolStay. We will trigger a simulated reset token in your server console output.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="forgot-email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="forgot-email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4.5 h-4.5" />
              {loading ? 'Sending link...' : 'Generate Reset Token'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setInfoMsg(''); }}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 text-slate-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </form>
        )}

        {/* MODE 3: Reset Password Form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/10 p-3 rounded-xl">
              Reset Token loaded automatically! Please set a new password.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="reset-token">
                Reset Token
              </label>
              <input
                type="text"
                id="reset-token"
                name="token"
                autoComplete="off"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter the reset token"
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="reset-password">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  id="reset-password"
                  name="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Update Password
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setInfoMsg(''); }}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 text-slate-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </form>
        )}

        {/* MODE 4: Anonymous Complaint Form */}
        {mode === 'anonymous-complaint' && (
          <form onSubmit={handleAnonymousComplaintSubmit} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Locked out or experiencing issues? Log an anonymous ticket directly.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/5 bg-slate-950 text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-xs font-semibold"
                >
                  <option value="WiFi">WiFi</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Detailed Description *
              </label>
              <textarea
                required
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-650 to-indigo-650 bg-violet-600 hover:bg-violet-555 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting...' : 'File Ticket'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setInfoMsg(''); }}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 text-slate-450 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </form>
        )}

        {/* MODE 5: Registration Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Register as a new PG Resident. An empty bed will be allocated to you automatically.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1" htmlFor="register-name">
                Full Name *
              </label>
              <input
                type="text"
                id="register-name"
                name="name"
                autoComplete="name"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1" htmlFor="register-email">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  autoComplete="username"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="john@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1" htmlFor="register-password">
                  Password *
                </label>
                <input
                  type="password"
                  id="register-password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1" htmlFor="register-phone">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="register-phone"
                  name="phone"
                  autoComplete="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="10 digit phone"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1" htmlFor="register-emergency">
                  Emergency Contact *
                </label>
                <input
                  type="tel"
                  id="register-emergency"
                  name="emergencyContact"
                  required
                  value={regEmergencyContact}
                  onChange={(e) => setRegEmergencyContact(e.target.value)}
                  placeholder="Emergency phone"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Registering...' : 'Register Profile'}
            </button>

            <div className="text-center mt-6 pt-4 border-t border-white/5 text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setInfoMsg(''); }}
                className="font-bold text-violet-400 hover:underline cursor-pointer"
              >
                Sign In Here
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
