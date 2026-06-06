import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  UserMinus, 
  Eye, 
  FileText,
  User as UserIcon,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

const Tenants = () => {
  const { token, showToast } = useAuth();
  
  // Data states
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // default show active
  const [roomFilter, setRoomFilter] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  
  // File refs
  const photoInputRef = useRef(null);
  const idInputRef = useRef(null);

  // API Call: Fetch Tenants
  const fetchTenants = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (roomFilter) queryParams.append('room', roomFilter);

      const res = await fetch(`/api/tenants?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      } else {
        showToast(data.message || 'Error fetching tenants list', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error fetching tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  // API Call: Fetch Rooms (to populate assigned room selector options)
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (err) {
      console.error('Failed to load room configurations:', err);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchRooms();
  }, [token, statusFilter, roomFilter]); // refetch on filter change

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchTenants();
    }
  };

  // Open Modal for Create
  const handleAddClick = () => {
    setModalMode('add');
    setName('');
    setEmail('');
    setPhone('');
    setEmergencyContact('');
    setRoomId('');
    
    // Default checkInDate to today's date in YYYY-MM-DD
    const today = new Date();
    setCheckInDate(today.toISOString().split('T')[0]);
    
    setSelectedTenant(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleEditClick = (tenant) => {
    setModalMode('edit');
    setSelectedTenant(tenant);
    setName(tenant.name);
    setEmail(tenant.email);
    setPhone(tenant.phone);
    setEmergencyContact(tenant.emergencyContact);
    setRoomId(tenant.room ? tenant.room._id : '');
    setCheckInDate(tenant.checkInDate ? tenant.checkInDate.split('T')[0] : '');
    setIsModalOpen(true);
  };

  // Open Modal for View Detail
  const handleViewClick = (tenant) => {
    setModalMode('view');
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  // Form Submit (Multipart / File upload setup)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !emergencyContact || !checkInDate) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('emergencyContact', emergencyContact);
    formData.append('checkInDate', checkInDate);
    if (roomId) {
      formData.append('room', roomId);
    } else {
      formData.append('room', '');
    }

    if (photoInputRef.current?.files[0]) {
      formData.append('photo', photoInputRef.current.files[0]);
    }
    if (idInputRef.current?.files[0]) {
      formData.append('idProof', idInputRef.current.files[0]);
    }

    try {
      const url = modalMode === 'add' ? '/api/tenants' : `/api/tenants/${selectedTenant._id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        if (modalMode === 'add') {
          // Log credentials to help testing
          console.log('\n================ NEW RESIDENT CREDENTIALS ================');
          console.log(`Email: ${data.credentials.email}`);
          console.log(`Password: ${data.credentials.defaultPassword}`);
          console.log('=========================================================\n');
          showToast(`Tenant registered! User login details: ${data.credentials.email} (Pw: ${data.credentials.defaultPassword})`, 'success');
        } else {
          showToast('Tenant profile updated successfully', 'success');
        }
        setIsModalOpen(false);
        fetchTenants();
        fetchRooms();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving profile', 'error');
    }
  };

  // Action: Checkout Tenant
  const handleCheckoutClick = async (tenantId) => {
    if (window.confirm('Are you sure you want to check out this resident? This will release their bed space and deactivate their login credentials.')) {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/checkout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          showToast('Resident checked out successfully. Access deactivated.', 'success');
          fetchTenants();
          fetchRooms();
        } else {
          showToast(data.message || 'Checkout failed', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error executing checkout', 'error');
      }
    }
  };

  // Action: Delete Tenant
  const handleDeleteClick = async (tenantId) => {
    if (window.confirm('Delete this tenant record entirely? This will remove all files and corresponding login details.')) {
      try {
        const res = await fetch(`/api/tenants/${tenantId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          showToast('Tenant record deleted', 'success');
          fetchTenants();
          fetchRooms();
        } else {
          showToast(data.message || 'Delete failed', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error deleting record', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Tenant Management
          </h1>
          <p className="text-sm text-slate-400 font-medium">Add, update profiles, review documents, and manage checkout logs.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm">
        {/* Search bar */}
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-450">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Type search & press Enter (searches name, email, phone)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-450">
              <Filter className="w-4.5 h-4.5" />
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-850 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-semibold"
            >
              <option value="active">Active Residents</option>
              <option value="checked_out">Checked Out Log</option>
              <option value="">All Tenants</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-850 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-semibold"
            >
              <option value="">All Rooms</option>
              {rooms.map(room => (
                <option key={room._id} value={room._id}>Room {room.roomNumber}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={fetchTenants}
            className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-violet-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading resident database...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center animate-fade-in">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No tenants recorded</h3>
          <p className="text-xs text-slate-450 mt-1">Change your search queries or add a new tenant to seed the table.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4.5 px-6">Resident Info</th>
                  <th className="py-4.5 px-6">Room Assigned</th>
                  <th className="py-4.5 px-6">Check-in Date</th>
                  <th className="py-4.5 px-6">Documents</th>
                  <th className="py-4.5 px-6">Status</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300">
                {tenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors">
                    {/* Resident Info Column */}
                    <td className="py-4 px-6 flex items-center gap-3.5 min-w-[240px]">
                      <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {tenant.photo ? (
                          <img src={tenant.photo} alt={tenant.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-white truncate">{tenant.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{tenant.email}</p>
                        <p className="text-[10px] text-slate-400 truncate">{tenant.phone}</p>
                      </div>
                    </td>

                    {/* Room Assigned Column */}
                    <td className="py-4 px-6">
                      {tenant.room ? (
                        <div>
                          <span className="font-bold text-slate-850 dark:text-slate-200">Room {tenant.room.roomNumber}</span>
                          <span className="block text-[10px] text-slate-400">Floor {tenant.room.floor}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Checkin Date Column */}
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(tenant.checkInDate).toLocaleDateString()}
                    </td>

                    {/* Documents Column */}
                    <td className="py-4 px-6">
                      {tenant.idProof ? (
                        <a 
                          href={tenant.idProof} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[10px] font-bold text-slate-655 dark:text-slate-350 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-violet-500" /> ID Card
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No document</span>
                      )}
                    </td>

                    {/* Status Badge Column */}
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        tenant.status === 'active' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {tenant.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right space-x-1 min-w-[170px]">
                      <button
                        onClick={() => handleViewClick(tenant)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-550 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer inline-block"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {tenant.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleEditClick(tenant)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-550 hover:text-violet-600 dark:hover:text-violet-400 transition-all cursor-pointer inline-block"
                            title="Edit Profile"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCheckoutClick(tenant._id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-slate-550 hover:text-rose-600 transition-all cursor-pointer inline-block"
                            title="Checkout Tenant"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {tenant.status === 'checked_out' && (
                        <button
                          onClick={() => handleDeleteClick(tenant._id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-slate-550 hover:text-rose-600 transition-all cursor-pointer inline-block"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'add' ? 'Register New Tenant' :
          modalMode === 'edit' ? 'Edit Resident Profile' :
          'Resident Profile Dossier'
        }
      >
        {modalMode === 'view' && selectedTenant ? (
          // VIEW DETAILS SUB-PANEL
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl bg-slate-50/30 dark:bg-slate-950/20">
              <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 shrink-0">
                {selectedTenant.photo ? (
                  <img src={selectedTenant.photo} alt={selectedTenant.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">{selectedTenant.name}</h4>
                <p className="text-xs text-slate-400">{selectedTenant.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedTenant.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Assigned Room</span>
                <p className="font-bold text-slate-800 dark:text-slate-250 mt-1">
                  {selectedTenant.room ? `Room ${selectedTenant.room.roomNumber} (Floor ${selectedTenant.room.floor})` : 'Unassigned'}
                </p>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Check-in Date</span>
                <p className="font-bold text-slate-800 dark:text-slate-250 mt-1">
                  {new Date(selectedTenant.checkInDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-800/80 rounded-xl col-span-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Emergency Contact Phone</span>
                <p className="font-bold text-slate-800 dark:text-slate-250 mt-1">{selectedTenant.emergencyContact}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-850 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-white rounded-xl cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          // CREATE / EDIT FORM SUB-PANEL
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@gmail.com"
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10 digit number"
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Emergency Contact *
                </label>
                <input
                  type="tel"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Emergency phone"
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Assign Room
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-medium"
                >
                  <option value="">Unassigned</option>
                  {rooms.map(room => {
                    // Check vacancy
                    const isFullyOccupied = room.occupancyStatus === 'fully_occupied';
                    const isCurrentRoom = selectedTenant && selectedTenant.room && selectedTenant.room._id === room._id;
                    
                    return (
                      <option 
                        key={room._id} 
                        value={room._id} 
                        disabled={isFullyOccupied && !isCurrentRoom}
                      >
                        Room {room.roomNumber} ({room.tenants.length}/{room.bedCapacity} filled) {isFullyOccupied && !isCurrentRoom ? ' - FULL' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-4.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            </div>

            {/* Document upload attachments */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850 mt-4">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Upload Dossier Credentials</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-550 dark:text-slate-400 font-semibold mb-1">
                    Tenant Photo (JPEG/PNG)
                  </label>
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-violet-50 dark:file:bg-violet-950/30 file:text-violet-700 dark:file:text-violet-400 hover:file:bg-violet-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-550 dark:text-slate-400 font-semibold mb-1">
                    ID Proof (PDF/JPEG/PNG)
                  </label>
                  <input
                    type="file"
                    ref={idInputRef}
                    accept="image/*,application/pdf"
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-violet-50 dark:file:bg-violet-950/30 file:text-violet-700 dark:file:text-violet-400 hover:file:bg-violet-100"
                  />
                </div>
              </div>
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-all cursor-pointer"
              >
                {modalMode === 'add' ? 'Register Profile' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Tenants;
