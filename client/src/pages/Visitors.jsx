import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Clock, 
  UserMinus, 
  CheckCircle,
  Users
} from 'lucide-react';

const Visitors = () => {
  const { user, token, showToast } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // Data states
  const [visitors, setVisitors] = useState([]);
  const [tenants, setTenants] = useState([]); // populated for admin guest host selection
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields: Register Visitor
  const [visitorName, setVisitorName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [contact, setContact] = useState('');
  const [hostTenantId, setHostTenantId] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/visitors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVisitors(data.data);
      } else {
        showToast('Error loading visitor logs', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error fetching visitors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/tenants?status=active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVisitors();
    fetchTenants();
  }, [token]);

  // Submit Register Visitor Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!visitorName) {
      showToast('Please enter visitor name', 'warning');
      return;
    }

    // Admin can submit without hostTenantId for general visitors

    try {
      const bodyPayload = {
        name: visitorName,
        relationship,
        contact,
        tenantId: isAdmin ? hostTenantId : undefined
      };

      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Visitor registered successfully', 'success');
        setIsModalOpen(false);
        setVisitorName('');
        setRelationship('');
        setContact('');
        setHostTenantId('');
        fetchVisitors();
      } else {
        showToast(data.message || 'Failed to register visitor', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error registering visitor', 'error');
    }
  };

  // Action: Record Visitor Checkout (Exit)
  const handleExitClick = async (visitorId) => {
    try {
      const res = await fetch(`/api/visitors/${visitorId}/exit`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        showToast('Visitor exit checkout completed', 'success');
        fetchVisitors();
      } else {
        showToast(data.message || 'Failed to checkout visitor', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error logging checkout', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {isAdmin ? 'Visitor Logs' : 'My Guests Log'}
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            {isAdmin ? 'Audit host-tenant associations and log visitor entry/exit times.' : 'Pre-register or view visitor logs visiting you at CoolStay.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Register Guest
        </button>
      </div>

      {/* Visitors List Grid/Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-violet-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading logs...</p>
        </div>
      ) : visitors.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center animate-fade-in">
          <CheckCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-semibold">No visitors logged</h3>
          <p className="text-xs text-slate-450 mt-1">Raise a guest pre-registration request to add logs.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4.5 px-6">Visitor Name</th>
                  <th className="py-4.5 px-6">Relationship</th>
                  <th className="py-4.5 px-6">Contact Number</th>
                  <th className="py-4.5 px-6">Host Resident</th>
                  <th className="py-4.5 px-6">Entry Time</th>
                  <th className="py-4.5 px-6">Exit Time</th>
                  <th className="py-4.5 px-6">Status</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300">
                {visitors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{v.name}</td>
                    <td className="py-4 px-6 text-slate-500">{v.relationship || 'Friend'}</td>
                    <td className="py-4 px-6 text-slate-500">{v.contact || '-'}</td>
                    <td className="py-4 px-6">
                      {v.tenant ? (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{v.tenant.name}</span>
                          <span className="block text-[10px] text-slate-400">
                            {v.tenant.room ? `Room ${v.tenant.room.roomNumber}` : 'Unassigned'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-500 dark:text-slate-405">General / Office</span>
                          <span className="block text-[10px] text-slate-400">{v.purpose || 'Delivery'}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-450">{new Date(v.entryTime).toLocaleString()}</td>
                    <td className="py-4 px-6 text-slate-450">
                      {v.exitTime ? new Date(v.exitTime).toLocaleString() : <span className="italic text-slate-400">Still inside</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        v.exitTime ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 animate-pulse'
                      }`}>
                        {v.exitTime ? 'Exited' : 'Inside'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {!v.exitTime ? (
                        <button
                          onClick={() => handleExitClick(v._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 font-bold text-[10px] cursor-pointer transition-all"
                        >
                          <UserMinus className="w-3.5 h-3.5" /> Log Exit
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase py-1.5 px-3">
                          Logged out
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog Form: Add Visitor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isAdmin ? 'Log Incoming Visitor' : 'Pre-register Guest entry'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Visitor Full Name *
            </label>
            <input
              type="text"
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. David Smith"
              className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Relationship to Host
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Parent, Friend, Brother"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="10 digit number"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
          </div>

          {/* Host Tenant selection (Admin only) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Host Tenant Profile (Optional)
              </label>
              <select
                value={hostTenantId}
                onChange={(e) => setHostTenantId(e.target.value)}
                className="w-full px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-semibold"
              >
                <option value="">None (General / Office / Delivery)</option>
                {tenants.map(t => (
                  <option key={t._id} value={t._id}>{t.name} (Room {t.room ? t.room.roomNumber : 'Unassigned'})</option>
                ))}
              </select>
            </div>
          )}

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
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-all cursor-pointer"
            >
              Log Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Visitors;
