import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Send, 
  Check, 
  AlertCircle, 
  QrCode, 
  Coins, 
  Sparkles,
  PlayCircle
} from 'lucide-react';

const Rent = () => {
  const { user, token, showToast } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // Data states
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]); // populated for manual manual sheet invoice dropdown
  const [loading, setLoading] = useState(true);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  // Modal States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Form Fields: Record Payment
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  // Form Fields: Manual Invoice
  const [manualTenantId, setManualTenantId] = useState('');
  const [manualMonth, setManualMonth] = useState('');
  const [manualAmount, setManualAmount] = useState(6000);
  const [manualDueDate, setManualDueDate] = useState('');

  // Payment Settings States
  const [paymentSettings, setPaymentSettings] = useState({ upiId: 'coolstay@ybl', bankName: 'CoolStay Cooperative Bank', accountNumber: '123456789012', ifscCode: 'CSCB0000001' });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsUpiId, setSettingsUpiId] = useState('');
  const [settingsBankName, setSettingsBankName] = useState('');
  const [settingsAccountNumber, setSettingsAccountNumber] = useState('');
  const [settingsIfscCode, setSettingsIfscCode] = useState('');

  // Bulk Reminders States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFallbacks, setBulkFallbacks] = useState([]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);
      if (monthFilter) queryParams.append('billingMonth', monthFilter);

      const res = await fetch(`/api/payments?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      } else {
        showToast('Error loading payments list', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error fetching payments', 'error');
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
    fetchPayments();
    fetchTenants();
    fetchPaymentSettings();
  }, [token, statusFilter, monthFilter]);

  // Action: Auto-generate Month dues
  const handleAutoGenerate = async () => {
    if (!window.confirm('Auto-generate rent invoices for all active rooms for the current month?')) return;

    try {
      const res = await fetch('/api/payments/auto-generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Dues generated: ${data.created} created, ${data.skipped} skipped.`, 'success');
        fetchPayments();
      } else {
        showToast(data.message || 'Auto generation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error generating dues', 'error');
    }
  };

  // Open Record Payment Modal
  const handlePayClick = (payment) => {
    setSelectedPayment(payment);
    // Suggest the full amount due (base rent + late fee)
    const totalDue = payment.amountDue + payment.lateFee;
    setAmountPaid(totalDue - payment.amountPaid);
    setPaymentMethod('upi');
    setIsPayModalOpen(true);
  };

  // Submit recorded payment
  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (amountPaid === '' || Number(amountPaid) <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/payments/${selectedPayment._id}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amountPaid: Number(amountPaid) + selectedPayment.amountPaid, paymentMethod })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Payment recorded successfully', 'success');
        setIsPayModalOpen(false);
        fetchPayments();
      } else {
        showToast(data.message || 'Payment failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving payment', 'error');
    }
  };

  // Action: Trigger WhatsApp Reminder
  const handleWhatsAppReminder = async (paymentId) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/whatsapp-reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        showToast(`WhatsApp reminder prepared! Dispatch method: ${data.method}`, 'success');
        
        // If it was simulated or clicked-to-chat, open wa.me link in new tab
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
      } else {
        showToast(data.message || 'Failed to trigger reminder', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error trigger reminder', 'error');
    }
  };

  // Open Manual Invoice Modal
  const handleManualInvoiceClick = () => {
    setManualTenantId('');
    
    // Set default month to current YYYY-MM
    const today = new Date();
    setManualMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    
    // Set default due date to 10th of today's month
    const dueDateObj = new Date(today.getFullYear(), today.getMonth(), 10);
    setManualDueDate(dueDateObj.toISOString().split('T')[0]);
    
    setManualAmount(6000);
    setIsManualModalOpen(true);
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch('/api/payments/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSettings(data.data);
        setSettingsUpiId(data.data.upiId);
        setSettingsBankName(data.data.bankName);
        setSettingsAccountNumber(data.data.accountNumber);
        setSettingsIfscCode(data.data.ifscCode);
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          upiId: settingsUpiId,
          bankName: settingsBankName,
          accountNumber: settingsAccountNumber,
          ifscCode: settingsIfscCode
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Payment settings updated successfully', 'success');
        setPaymentSettings(data.data);
        setIsSettingsModalOpen(false);
      } else {
        showToast(data.message || 'Failed to update settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving settings', 'error');
    }
  };

  const handleBulkReminderClick = async () => {
    if (!window.confirm('Send payment reminders to all unpaid tenants?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/payments/bulk-reminders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(data.message, 'success');
        if (data.fallbacks && data.fallbacks.length > 0) {
          setBulkFallbacks(data.fallbacks);
          setIsBulkModalOpen(true);
        }
      } else {
        showToast(data.message || 'Failed to dispatch reminders', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error triggering reminders', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Manual Invoice
  const handleManualInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!manualTenantId || !manualMonth || !manualAmount || !manualDueDate) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tenantId: manualTenantId,
          billingMonth: manualMonth,
          amountDue: Number(manualAmount),
          dueDate: manualDueDate
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Invoice generated successfully', 'success');
        setIsManualModalOpen(false);
        fetchPayments();
      } else {
        showToast(data.message || 'Failed to create invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error creating invoice', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {isAdmin ? 'Rent & Collections' : 'My Rent Invoices'}
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            {isAdmin ? 'Auto-generate monthly rent invoices, calculate late fees, and track transaction collections.' : 'Monitor your PG billing sheets and submit mock payments.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleAutoGenerate}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-violet-650 hover:bg-violet-555 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" /> Auto-Generate
            </button>
            <button
              onClick={handleManualInvoiceClick}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white transition-all cursor-pointer"
            >
              Create Manual Invoice
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white transition-all cursor-pointer"
            >
              Payment Settings
            </button>
            <button
              onClick={handleBulkReminderClick}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-705 dark:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Bulk Reminders
            </button>
          </div>
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
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-850 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Billing Month (YYYY-MM)..."
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-violet-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading billing archives...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center animate-fade-in">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-semibold">No invoices generated</h3>
          <p className="text-xs text-slate-450 mt-1">Try changing your filters or trigger billing generation.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAdmin && <th className="py-4.5 px-6">Tenant Name</th>}
                  <th className="py-4.5 px-6">Month</th>
                  <th className="py-4.5 px-6">Due Amount</th>
                  <th className="py-4.5 px-6">Late Fee</th>
                  <th className="py-4.5 px-6">Paid Amount</th>
                  <th className="py-4.5 px-6">Due Date</th>
                  <th className="py-4.5 px-6">Status</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300">
                {payments.map((p) => {
                  const balanceDue = p.amountDue + p.lateFee - p.amountPaid;
                  
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                      {isAdmin && (
                        <td className="py-4 px-6">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-white block">{p.tenant?.name || 'Unknown'}</span>
                            <span className="block text-[10px] text-slate-400">
                              {p.tenant?.room ? `Room ${p.tenant.room.roomNumber}` : 'Unassigned'}
                            </span>
                          </div>
                        </td>
                      )}
                      
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400 font-bold">{p.billingMonth}</td>
                      <td className="py-4 px-6">Rs. {p.amountDue.toLocaleString()}</td>
                      <td className="py-4 px-6 text-rose-500">
                        {p.lateFee > 0 ? `Rs. ${p.lateFee.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400">Rs. {p.amountPaid.toLocaleString()}</td>
                      <td className="py-4 px-6 text-slate-450">{new Date(p.dueDate).toLocaleDateString()}</td>
                      
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          p.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                          p.status === 'overdue' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 animate-pulse' :
                          'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2 min-w-[190px]">
                        {p.status !== 'paid' && (
                          <button
                            onClick={() => handlePayClick(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm hover:shadow transition-all cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> {isAdmin ? 'Record Pay' : 'Pay Online'}
                          </button>
                        )}
                        
                        {isAdmin && p.status !== 'paid' && (
                          <button
                            onClick={() => handleWhatsAppReminder(p._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-white text-[10px] font-bold cursor-pointer transition-all"
                            title="Send WhatsApp Reminder"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                          </button>
                        )}

                        {p.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase py-1.5 px-3">
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Record / Perform Online Payment */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={isAdmin ? 'Record Payment Details' : 'Online Rent Payment Gateway'}
      >
        {selectedPayment && (
          <form onSubmit={handlePaySubmit} className="space-y-5">
            {/* Payment Summary */}
            <div className="p-4 border border-slate-100 dark:border-slate-850 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Billing Month:</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedPayment.billingMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Base Rent Dues:</span>
                <span className="font-bold text-slate-800 dark:text-white">Rs. {selectedPayment.amountDue.toLocaleString()}</span>
              </div>
              {selectedPayment.lateFee > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Late Penalty Fee:</span>
                  <span className="font-bold">Rs. {selectedPayment.lateFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Already Paid:</span>
                <span className="font-bold text-slate-800 dark:text-white">Rs. {selectedPayment.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold text-sm">
                <span className="text-slate-800 dark:text-white">Total Pending:</span>
                <span className="text-violet-600 dark:text-violet-400">
                  Rs. {(selectedPayment.amountDue + selectedPayment.lateFee - selectedPayment.amountPaid).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Resident Gateway Scanner Widget */}
            {!isAdmin && (
              <div className="p-4 border border-violet-100 dark:border-violet-950/50 rounded-2xl bg-violet-50/20 dark:bg-violet-950/10 flex flex-col items-center justify-center text-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${paymentSettings.upiId}&pn=CoolStay%20PG&am=${amountPaid || 0}`)}`} 
                  alt="UPI QR Code" 
                  className="w-32 h-32 mb-2 p-1.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-white shadow-md"
                />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Mock Scan UPI QR Code</p>
                <p className="text-[9px] text-slate-400 mt-1">UPI ID: <span className="font-bold text-violet-600 dark:text-violet-400">{paymentSettings.upiId}</span></p>
                
                {/* Bank Account Details Option */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 w-full text-left text-[10px] text-slate-450 space-y-1">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">Or Net Banking Transfer:</p>
                  <p>Bank: <span className="font-semibold text-slate-700 dark:text-slate-300">{paymentSettings.bankName}</span></p>
                  <p>Account: <span className="font-semibold text-slate-700 dark:text-slate-300">{paymentSettings.accountNumber}</span></p>
                  <p>IFSC: <span className="font-semibold text-slate-700 dark:text-slate-300">{paymentSettings.ifscCode}</span></p>
                </div>
              </div>
            )}

            {/* Input Details */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Amount to Pay (Rs.) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedPayment.amountDue + selectedPayment.lateFee - selectedPayment.amountPaid}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-4.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-medium"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="bank_transfer">Net Banking / NEFT</option>
                <option value="card">Credit or Debit Card</option>
                {isAdmin && <option value="cash">Cash Collection</option>}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <PlayCircle className="w-4.5 h-4.5 animate-pulse" />
                {isAdmin ? 'Record Transaction' : 'Confirm Simulated Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 2: Create Manual Invoice (Admin Only) */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Generate Manual Rent Sheet"
      >
        <form onSubmit={handleManualInvoiceSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Select Resident Tenant *
            </label>
            <select
              required
              value={manualTenantId}
              onChange={(e) => setManualTenantId(e.target.value)}
              className="w-full px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-medium"
            >
              <option value="">Choose resident...</option>
              {tenants.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} (Room {t.room ? t.room.roomNumber : 'Unassigned'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Billing Month *
              </label>
              <input
                type="text"
                required
                placeholder="YYYY-MM (e.g. 2026-06)"
                value={manualMonth}
                onChange={(e) => setManualMonth(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-855 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={manualDueDate}
                onChange={(e) => setManualDueDate(e.target.value)}
                className="w-full px-4.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-855 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Billing Rent Amount (Rs.) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-all cursor-pointer"
            >
              Generate Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Payment Settings (Admin Only) */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Configure PG Payment Methods"
      >
        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure the custom payment details that residents will see when making rent payments.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              UPI ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. merchant@bank"
              value={settingsUpiId}
              onChange={(e) => setSettingsUpiId(e.target.value)}
              className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Bank Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. State Bank of India"
              value={settingsBankName}
              onChange={(e) => setSettingsBankName(e.target.value)}
              className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Account Number *
              </label>
              <input
                type="text"
                required
                placeholder="Account number"
                value={settingsAccountNumber}
                onChange={(e) => setSettingsAccountNumber(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                IFSC Code *
              </label>
              <input
                type="text"
                required
                placeholder="IFSC code"
                value={settingsIfscCode}
                onChange={(e) => setSettingsIfscCode(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-350 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-all cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Bulk WhatsApp Reminders (Admin Only) */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Unpaid Rent WhatsApp Reminders"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Twilio API fell back to client-side dispatch. Click on each resident below to launch their WhatsApp Web click-to-chat reminder.
          </p>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850 pr-1 text-slate-800 dark:text-slate-200">
            {bulkFallbacks.map((f, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="text-left">
                  <span className="font-bold block">{f.name}</span>
                  <span className="text-[10px] text-slate-450 block">Status: Reminder Ready</span>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3 animate-pulse" /> Send Chat
                </a>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
            <button
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Rent;
