import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Bed, Plus, Search, Filter, Edit3, Trash2, ShieldAlert } from 'lucide-react';

const Rooms = () => {
  const { token, showToast } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Form Fields
  const [roomNumber, setRoomNumber] = useState('');
  const [bedCapacity, setBedCapacity] = useState(2);
  const [floor, setFloor] = useState(1);
  const [rentPerBed, setRentPerBed] = useState(6000);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      } else {
        showToast(data.message || 'Error fetching rooms', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error fetching rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [token]);

  // Open Modal for Add
  const handleAddClick = () => {
    setModalMode('add');
    setRoomNumber('');
    setBedCapacity(2);
    setFloor(1);
    setRentPerBed(6000);
    setSelectedRoomId(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleEditClick = (room) => {
    setModalMode('edit');
    setSelectedRoomId(room._id);
    setRoomNumber(room.roomNumber);
    setBedCapacity(room.bedCapacity);
    setFloor(room.floor);
    setRentPerBed(room.rentPerBed);
    setIsModalOpen(true);
  };

  // Save Room (Create / Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!roomNumber || !bedCapacity || !rentPerBed) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      const url = modalMode === 'add' ? '/api/rooms' : `/api/rooms/${selectedRoomId}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ roomNumber, bedCapacity: Number(bedCapacity), floor: Number(floor), rentPerBed: Number(rentPerBed) })
      });
      const data = await res.json();

      if (data.success) {
        showToast(modalMode === 'add' ? 'Room added successfully!' : 'Room updated successfully!', 'success');
        setIsModalOpen(false);
        fetchRooms();
      } else {
        showToast(data.message || 'Save failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving room', 'error');
    }
  };

  // Delete Room
  const handleDeleteClick = async (roomId, tenantCount) => {
    if (tenantCount > 0) {
      showToast('Cannot delete room with active residents!', 'warning');
      return;
    }

    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/rooms/${roomId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          showToast('Room deleted successfully', 'success');
          fetchRooms();
        } else {
          showToast(data.message || 'Failed to delete room', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error deleting room', 'error');
      }
    }
  };

  // Filter Logic
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || room.occupancyStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Room Configurations
          </h1>
          <p className="text-sm text-slate-400 font-medium">Manage PG room sizes, floors, bed pricing, and allocations.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-450">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-slate-450 shrink-0">
            <Filter className="w-4.5 h-4.5" />
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-850 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="vacant">Vacant</option>
            <option value="partially_occupied">Partially Occupied</option>
            <option value="fully_occupied">Fully Occupied</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-violet-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading rooms list...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No rooms found</h3>
          <p className="text-xs text-slate-450 mt-1">Try resetting your filters or create a new room configuration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const occupiedBedsCount = room.tenants ? room.tenants.length : 0;
            const vacantBedsCount = room.bedCapacity - occupiedBedsCount;

            return (
              <div 
                key={room._id} 
                className="p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900/40 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-850 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        Room {room.roomNumber}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Floor {room.floor} • Rs. {room.rentPerBed.toLocaleString()} / bed
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      room.occupancyStatus === 'fully_occupied' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' :
                      room.occupancyStatus === 'partially_occupied' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                      'bg-emerald-105 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {room.occupancyStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Bed Capacity Visualizer Indicators */}
                  <div className="mt-5 flex gap-2">
                    {/* Render Occupied Beds */}
                    {Array.from({ length: occupiedBedsCount }).map((_, idx) => (
                      <div key={`occ-${idx}`} className="flex-1 p-2 border border-violet-100 dark:border-violet-900/20 rounded-xl bg-violet-50/50 dark:bg-violet-950/10 text-violet-600 dark:text-violet-400 flex items-center justify-center" title="Occupied Bed">
                        <Bed className="w-5 h-5 fill-violet-600/20 dark:fill-violet-450/20" />
                      </div>
                    ))}
                    {/* Render Vacant Beds */}
                    {Array.from({ length: vacantBedsCount }).map((_, idx) => (
                      <div key={`vac-${idx}`} className="flex-1 p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-550 flex items-center justify-center" title="Vacant Bed">
                        <Bed className="w-5 h-5" />
                      </div>
                    ))}
                  </div>

                  {/* Assigned Residents names */}
                  <div className="mt-5 border-t border-slate-100 dark:border-slate-850 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Residents</p>
                    {occupiedBedsCount === 0 ? (
                      <p className="text-xs text-slate-400 italic">No tenants checked-in</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {room.tenants.map((tenant) => (
                          <span key={tenant._id} className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-200 font-semibold">
                            {tenant.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={() => handleEditClick(room)}
                    className="p-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Edit Room"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(room._id, occupiedBedsCount)}
                    disabled={occupiedBedsCount > 0}
                    className={`p-2 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer ${
                      occupiedBedsCount > 0 
                        ? 'opacity-30 cursor-not-allowed text-slate-300' 
                        : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                    }`}
                    title="Delete Room"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add New Room' : 'Edit Room Details'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Room Number *
            </label>
            <input
              type="text"
              required
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 101, 204A"
              className="w-full px-4.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Bed Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={bedCapacity}
                onChange={(e) => setBedCapacity(e.target.value)}
                className="w-full px-4.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Floor Number *
              </label>
              <input
                type="number"
                min="0"
                required
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-4.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Rent Per Bed (Rs. / Month) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={rentPerBed}
              onChange={(e) => setRentPerBed(e.target.value)}
              placeholder="e.g. 7000"
              className="w-full px-4.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-all cursor-pointer"
            >
              {modalMode === 'add' ? 'Add Room' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rooms;
