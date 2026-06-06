import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { 
  Bed, 
  Users, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, token, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('complaints'); // for admin activity list

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const endpoint = user.role === 'admin' ? '/api/dashboard/admin' : '/api/dashboard/tenant';
        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          showToast(result.message || 'Failed to load dashboard metrics', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Connection error fetching metrics', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-violet-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading dashboard data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
        <HelpCircle className="w-12 h-12 text-slate-400 mb-2" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dashboard Unavailable</h3>
        <p className="text-sm text-slate-500 mt-1">We couldn't load the dashboard stats. Try checking your database server.</p>
      </div>
    );
  }

  // ================= ADMIN VIEW RENDERING =================
  if (user.role === 'admin') {
    const { stats, recentComplaints, recentVisitors } = data;
    
    // Calculate expected collections
    const totalBilled = stats.monthlyRevenue + stats.pendingRent;
    const paymentRate = totalBilled > 0 ? Math.round((stats.monthlyRevenue / totalBilled) * 100) : 0;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Dashboard Title & Actions banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-400 font-medium">Real-time metrics for CoolStay PG Management.</p>
          </div>
          <div className="flex gap-2.5">
            <Link 
              to="/tenants" 
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Tenant
            </Link>
            <Link 
              to="/rooms" 
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              Manage Rooms
            </Link>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Total Rooms" 
            value={`${stats.totalRooms}`} 
            icon={Bed} 
            color="blue"
            trend={`${stats.occupiedRooms} occupied / ${stats.vacantRooms} vacant`}
          />
          <StatCard 
            title="Total Tenants" 
            value={`${stats.totalTenants}`} 
            icon={Users} 
            color="violet"
            trend="Active check-in profiles"
          />
          <StatCard 
            title="Monthly Revenue" 
            value={`Rs. ${stats.monthlyRevenue.toLocaleString()}`} 
            icon={DollarSign} 
            color="emerald"
            trend={`${paymentRate}% of invoices paid`}
          />
          <StatCard 
            title="Pending Rent Dues" 
            value={`Rs. ${stats.pendingRent.toLocaleString()}`} 
            icon={Clock} 
            color="rose"
            trend="Unpaid billing periods"
          />
        </div>

        {/* Aggregated Visual Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue collection chart gauge */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Collection Efficiency
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Payment distribution for this month.</p>
            </div>
            
            <div className="my-6 flex flex-col items-center justify-center">
              {/* Circular progress bar SVG */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="40" className="stroke-emerald-500 fill-none transition-all duration-1000" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * paymentRate) / 100} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{paymentRate}%</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collected</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between border-t border-slate-100 dark:border-slate-850 pt-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Paid (Rs. {stats.monthlyRevenue.toLocaleString()})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span>Pending (Rs. {stats.pendingRent.toLocaleString()})</span>
              </div>
            </div>
          </div>

          {/* Activity Logs Widgets */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col">
            {/* Widget Header Tab buttons */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-500" /> PG Logs Tracker
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Monitor tickets and pre-authorized visitor activity.</p>
              </div>
              
              <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs font-bold shrink-0">
                <button
                  onClick={() => setActiveTab('complaints')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'complaints' ? 'bg-white dark:bg-slate-900 shadow text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}
                >
                  Complaints
                </button>
                <button
                  onClick={() => setActiveTab('visitors')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'visitors' ? 'bg-white dark:bg-slate-900 shadow text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}
                >
                  Visitors
                </button>
              </div>
            </div>

            {/* Tab Body list contents */}
            <div className="flex-grow mt-4 overflow-y-auto max-h-[220px]">
              {activeTab === 'complaints' ? (
                recentComplaints.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No complaints submitted recently.</p>
                ) : (
                  <div className="space-y-3.5">
                    {recentComplaints.map((c) => (
                      <div key={c._id} className="flex items-start justify-between gap-3 text-xs p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            {c.isAnonymous ? `Anonymous (Room ${c.roomNumber})` : (c.tenant?.name || 'Unknown')} - <span className="text-violet-600 dark:text-violet-400">{c.category}</span>
                          </p>
                          <p className="text-slate-400 truncate mt-0.5">{c.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] shrink-0 ${
                          c.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                          c.status === 'in_progress' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                          'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                recentVisitors.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No visitor check-ins recorded recently.</p>
                ) : (
                  <div className="space-y-3.5">
                    {recentVisitors.map((v) => (
                      <div key={v._id} className="flex items-start justify-between gap-3 text-xs p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            {v.name} <span className="text-slate-400 font-normal">({v.relationship || 'Visitor'})</span>
                          </p>
                          <p className="text-slate-400 mt-0.5">Host: {v.tenant?.name || 'Unknown'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] shrink-0 ${
                          v.exitTime ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 animate-pulse'
                        }`}>
                          {v.exitTime ? 'Exited' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= TENANT VIEW RENDERING =================
  const { profile, room, billing, recentComplaints, recentVisitors } = data;
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title greeting banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Resident Portal
        </h1>
        <p className="text-sm text-slate-400 font-medium">Manage your room bookings, dues, complaints, and visitor list.</p>
      </div>

      {/* Stats cards summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Room Assigned" 
          value={room ? `Room ${room.roomNumber}` : 'Unassigned'} 
          icon={Bed} 
          color="blue"
          trend={room ? `Floor ${room.floor} - ${room.bedCapacity} Bed capacity` : 'Contact desk'}
        />
        <StatCard 
          title="Current Due Amount" 
          value={billing.currentBill ? `Rs. ${(billing.currentBill.amountDue + billing.currentBill.lateFee - billing.currentBill.amountPaid).toLocaleString()}` : 'Rs. 0'} 
          icon={DollarSign} 
          color={billing.currentBill?.status === 'paid' ? 'emerald' : 'amber'}
          trend={billing.currentBill ? `Billing month: ${billing.currentBill.billingMonth} (${billing.currentBill.status.toUpperCase()})` : 'No bills generated'}
        />
        <StatCard 
          title="Total Outstanding Dues" 
          value={`Rs. ${billing.totalDues.toLocaleString()}`} 
          icon={Clock} 
          color={billing.totalDues > 0 ? 'rose' : 'emerald'}
          trend="Sum of all overdue bills"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roommates information list card */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-blue-500" /> My Roommates
          </h3>
          
          {!room ? (
            <p className="text-xs text-slate-400 py-6 text-center">Assign to a room first to see roommates.</p>
          ) : room.roommates.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No other roommates in this room.</p>
          ) : (
            <div className="space-y-4">
              {room.roommates.map((rm, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-xs">
                    {rm.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{rm.name}</p>
                    <p className="text-[10px] text-slate-400">{rm.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaints and visitor logger widget list */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Complaints list */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500" /> My Complaints
                </h3>
                <Link to="/complaints" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
                  File Ticket
                </Link>
              </div>
              
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {recentComplaints.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No active complaints filed.</p>
                ) : (
                  recentComplaints.map((c) => (
                    <div key={c._id} className="flex items-start justify-between gap-3 text-xs p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 dark:text-slate-200">{c.category}</p>
                        <p className="text-slate-400 truncate mt-0.5">{c.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        c.status === 'resolved' ? 'bg-emerald-105 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                        c.status === 'in_progress' ? 'bg-amber-105 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                        'bg-rose-105 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Visitor Logs list */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-emerald-500" /> Pre-register Visitor
                </h3>
                <Link to="/visitors" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
                  Log Entry
                </Link>
              </div>

              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {recentVisitors.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No visitors logged.</p>
                ) : (
                  recentVisitors.map((v) => (
                    <div key={v._id} className="flex items-start justify-between gap-3 text-xs p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 dark:text-slate-200">{v.name}</p>
                        <p className="text-slate-450 mt-0.5">{v.relationship || 'Friend'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        v.exitTime ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 animate-pulse'
                      }`}>
                        {v.exitTime ? 'Exited' : 'Active'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
