import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Users, 
  DollarSign, 
  ArrowRight,
  Printer,
  ShieldAlert
} from 'lucide-react';

const Reports = () => {
  const { user, token, showToast } = useAuth();
  
  // Guard access
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 border border-dashed border-rose-250 rounded-3xl bg-rose-50/10">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-2" />
        <h3 className="text-lg font-bold text-rose-700 dark:text-rose-455">Access Denied</h3>
        <p className="text-sm text-slate-450 mt-1">This analytical report panel is restricted to PG Management Admins only.</p>
      </div>
    );
  }

  // Data states
  const [revenue, setRevenue] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [tenantStats, setTenantStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all reports concurrently
      const [revRes, occRes, tenRes] = await Promise.all([
        fetch('/api/reports/revenue', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/reports/occupancy', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/reports/tenants', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [revData, occData, tenData] = await Promise.all([
        revRes.json(),
        occRes.json(),
        tenRes.json()
      ]);

      if (revData.success && occData.success && tenData.success) {
        setRevenue(revData.data);
        setOccupancy(occData.data);
        setTenantStats(tenData.data);
      } else {
        showToast('Failed to compile report summaries', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error loading reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Action: Print report
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-2">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-violet-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Compiling analytical reports...</p>
      </div>
    );
  }

  // Find max value in monthly revenue to scale the custom SVG bar chart correctly
  const maxCollection = revenue.length > 0 
    ? Math.max(...revenue.map(item => Math.max(item.collected, item.expected))) 
    : 10000;

  return (
    <div className="space-y-8 animate-fade-in print:p-8">
      {/* Title header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Analytical Reports
          </h1>
          <p className="text-sm text-slate-400 font-medium">Verify PG revenue statistics, bed occupancy trends, and floor demographics.</p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-white transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" /> Print Dossier
        </button>
      </div>

      {/* Overview Cards block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Bed Occupancy Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-850 dark:text-white">{occupancy?.beds.occupancyRate}%</span>
            <span className="text-xs text-slate-400 font-semibold">({occupancy?.beds.occupied} / {occupancy?.beds.total} beds filled)</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-850 mt-4 overflow-hidden">
            <div 
              style={{ width: `${occupancy?.beds.occupancyRate}%` }} 
              className="h-full rounded-full bg-gradient-to-r from-violet-650 to-indigo-650 bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.3)]"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Demographics</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-850 dark:text-white">{tenantStats?.active}</span>
            <span className="text-xs text-slate-450 font-semibold">Active residents checked-in</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 font-semibold uppercase tracking-wider">
            {tenantStats?.checkedOut} checked-out profiles archived
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Hostel capacity</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-850 dark:text-white">{occupancy?.rooms.total}</span>
            <span className="text-xs text-slate-450 font-semibold">Total room sets</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-wider">
            {occupancy?.rooms.vacant} vacant • {occupancy?.rooms.partiallyOccupied} partial • {occupancy?.rooms.fullyOccupied} full
          </p>
        </div>
      </div>

      {/* Revenue bar chart container */}
      <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-emerald-500" /> Monthly Collections Revenue Trend
        </h3>

        {revenue.length === 0 ? (
          <p className="text-xs text-slate-400 py-16 text-center">No collections history loaded yet.</p>
        ) : (
          <div className="space-y-6">
            {/* Custom SVG Scaled Bar chart */}
            <div className="relative h-64 border-b border-l border-slate-200 dark:border-slate-800/80 px-2 sm:px-6 pb-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-slate-400 pr-2 pt-2 border-r border-slate-100 dark:border-slate-850 border-t">
                <span>Rs. {maxCollection.toLocaleString()}</span>
                <span>Rs. {(maxCollection / 2).toLocaleString()}</span>
                <span>Rs. 0</span>
              </div>
              
              {/* Bars container */}
              <div className="h-full flex items-end justify-around relative z-10 pt-6">
                {revenue.map((item, idx) => {
                  const collPct = (item.collected / maxCollection) * 100;
                  const expPct = (item.expected / maxCollection) * 100;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-16 sm:w-20 group">
                      <div className="flex gap-1.5 h-48 items-end justify-center w-full">
                        {/* Expected Bar */}
                        <div 
                          style={{ height: `${expPct}%` }}
                          className="w-4 sm:w-5 bg-slate-200 dark:bg-slate-800 rounded-t-md transition-all duration-500 group-hover:bg-slate-300 dark:group-hover:bg-slate-700"
                          title={`Expected: Rs. ${item.expected}`}
                        />
                        {/* Collected Bar */}
                        <div 
                          style={{ height: `${collPct}%` }}
                          className="w-4 sm:w-5 bg-emerald-500 rounded-t-md shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-500 group-hover:bg-emerald-400"
                          title={`Collected: Rs. ${item.collected}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Legends */}
            <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800" />
                <span>Expected Invoices Dues</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 rounded bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
                <span>Collected Payments</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floor demographic distributions details */}
      <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm max-w-xl">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-violet-500" /> Floor Demographic Distribution
        </h3>
        
        {tenantStats?.byFloor.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No floor details available.</p>
        ) : (
          <div className="space-y-4">
            {tenantStats?.byFloor.map((f, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-305">
                  <span>{f.floor}</span>
                  <span>{f.count} Active Tenants</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden">
                  <div 
                    style={{ width: `${(f.count / tenantStats.active) * 100}%` }}
                    className="h-full rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.3)]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
