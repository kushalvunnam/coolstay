const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const rooms = await Room.find().populate({
      path: 'tenants',
      select: 'name email phone status'
    });
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('tenants');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Tenant can view their room only
    if (req.user.role === 'tenant') {
      const isMyRoom = room.tenants.some(tenant => tenant.userId.toString() === req.user.id.toString());
      if (!isMyRoom) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this room' });
      }
    }

    res.json({ success: true, data: room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { roomNumber, bedCapacity, floor, rentPerBed } = req.body;

  if (!roomNumber || !bedCapacity || !floor || !rentPerBed) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  try {
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ success: false, message: 'Room number already exists' });
    }

    const room = await Room.create({
      roomNumber,
      bedCapacity,
      floor,
      rentPerBed,
      tenants: []
    });

    res.status(201).json({ success: true, data: room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const { roomNumber, bedCapacity, floor, rentPerBed } = req.body;

    if (bedCapacity && bedCapacity < room.tenants.length) {
      return res.status(400).json({
        success: false,
        message: `Cannot lower bed capacity to ${bedCapacity} because there are currently ${room.tenants.length} tenants assigned`
      });
    }

    if (roomNumber && roomNumber !== room.roomNumber) {
      const roomExists = await Room.findOne({ roomNumber });
      if (roomExists) {
        return res.status(400).json({ success: false, message: 'Room number already exists' });
      }
      room.roomNumber = roomNumber;
    }

    room.bedCapacity = bedCapacity || room.bedCapacity;
    room.floor = floor !== undefined ? floor : room.floor;
    room.rentPerBed = rentPerBed || room.rentPerBed;

    await room.save(); // pre-save will update occupancyStatus

    res.json({ success: true, data: room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.tenants && room.tenants.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete room. There are ${room.tenants.length} tenants currently occupying this room. Please reassign them first.`
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
