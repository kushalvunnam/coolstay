import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  AlertTriangle, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle, 
  HelpCircle,
  Wrench,
  Wifi,
  Sparkles,
  Zap,
  Droplet
} from 'lucide-react';

const Complaints = () => {
  const { user, token, showToast } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // Data states
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State (For Admin only, though applicable generally)
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields: New Complaint (Tenant/Admin)
  const [category, setCategory] = useState('WiFi');
  const [description, setDescription] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);
      if (categoryFilter) queryParams.append('category', categoryFilter);

      const res = await fetch(`/api/complaints?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(data.data);
      } else {
        showToast('Error loading complaints logs', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error fetching complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [token, statusFilter, categoryFilter]);

  // Submit New Complaint
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!description) {
      showToast('Please describe your complaint', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category, description })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Complaint ticket raised successfully', 'success');
        setIsModalOpen(false);
        setDescription('');
        fetchComplaints();
      } else {
        showToast(data.message || 'Failed to submit complaint', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error submitting complaint', 'error');
    }
  };

  // Action: Update Complaint Status (Admin Only)
  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Ticket status updated to: ${newStatus.replace('_', ' ')}`, 'success');
        fetchComplaints();
      } else {
        showToast(data.message || 'Failed to update ticket status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating status', 'error');
    }
  };

  // Helper: Get Category Icon
  const getCategoryIcon = (cat) => {
    const iconClass = "w-5 h-5 shrink-0";
    switch (cat) {
      case 'WiFi':
        return <Wifi className={`${iconClass} text-sky-500`} />;
      case 'Electricity':
        return <Zap className={`${iconClass} text-amber-500`} />;
      case 'Water':
        return <Droplet className={`${iconClass} text-blue-500`} />;
      case 'Cleaning':
        return <Sparkles className={`${iconClass} text-emerald-500`} />;
      default:
        return <Wrench className={`${iconClass} text-slate-500`} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {isAdmin ? 'Resident complaints' : 'My Service Tickets'}
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            {isAdmin ? 'Monitor facilities issues raised by residents and coordinate updates.' : 'Submit a request to resolve utilities issues in your room.'}
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Raise Ticket
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-450">
            <Filter className="w-4.5 h-4.5" />
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-855 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-855 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-semibold"
          >
            <option value="">All Categories</option>
            <option value="Electricity">Electricity</option>
            <option value="Water">Water</option>
            <option value="WiFi">WiFi</option>
            <option value="Cleaning">Cleaning</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-violet-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading complaints registry...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center animate-fade-in">
          <CheckCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Clean Slate!</h3>
          <p className="text-xs text-slate-450 mt-1">No active complaint logs match your filter settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complaints.map((c) => (
            <div 
              key={c._id} 
              className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
            >
              <div className="space-y-3">
                {/* Category Icon and Status badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(c.category)}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">{c.category}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider -mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                    c.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                    c.status === 'in_progress' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                    'bg-rose-105 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                  {c.description}
                </p>
              </div>

              {/* Card Footer: Metadata or Admin tools */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-between shrink-0">
                {/* Host Resident name (For admin) */}
                {isAdmin ? (
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Submitted By</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {c.isAnonymous 
                        ? `Anonymous (Room ${c.roomNumber})` 
                        : `${c.tenant?.name || 'Unknown'} (Room ${c.tenant?.room ? c.tenant.room.roomNumber : 'Unassigned'})`
                      }
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{c.status === 'resolved' ? `Resolved on ${new Date(c.resolvedAt).toLocaleDateString()}` : 'Pending review'}</span>
                  </div>
                )}

                {/* Admin Status Dropdown */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Set Status</span>
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c._id, e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-300 rounded-lg text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog Form (Raise Complaint Ticket) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Support Complaint Ticket"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Service Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-855 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-semibold"
            >
              <option value="WiFi">WiFi Connection</option>
              <option value="Electricity">Electricity / Appliances</option>
              <option value="Water">Water / Washroom Plumbing</option>
              <option value="Cleaning">Cleaning / Garbage Waste</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Detailed Description *
            </label>
            <textarea
              required
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please elaborate on the issue (e.g. WiFi is failing to connect in Room 201 since morning...)"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all cursor-pointer"
            >
              Raise Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Complaints;
