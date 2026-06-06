const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Room = require('../models/Room');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// @desc    Get all tenants
// @route   GET /api/tenants
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { search, status, room } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (room) {
      query.room = room;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const tenants = await Tenant.find(query).populate('room');
    res.json({ success: true, count: tenants.length, data: tenants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get single tenant details
// @route   GET /api/tenants/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('room');

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Tenant can only see their own details, Admin can see all
    if (req.user.role === 'tenant' && req.user.tenantId.toString() !== tenant._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
    }

    res.json({ success: true, data: tenant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create new tenant
// @route   POST /api/tenants
// @access  Private/Admin
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
  ]),
  async (req, res) => {
    const { name, email, phone, emergencyContact, room, checkInDate } = req.body;

    if (!name || !email || !phone || !emergencyContact || !checkInDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    try {
      // Check if user account email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User account with this email already exists' });
      }

      // Check if room has vacancy if specified
      let roomDoc = null;
      if (room) {
        roomDoc = await Room.findById(room);
        if (!roomDoc) {
          return res.status(404).json({ success: false, message: 'Room not found' });
        }
        if (roomDoc.tenants.length >= roomDoc.bedCapacity) {
          return res.status(400).json({ success: false, message: 'Selected room is already fully occupied' });
        }
      }

      // 1. Create User account first. Default password is the tenant's phone number.
      const defaultPassword = phone.replace(/[^0-9]/g, '').slice(-6) || 'tenant123'; // Last 6 digits or default
      const user = await User.create({
        name,
        email,
        password: defaultPassword,
        role: 'tenant'
      });

      // 2. Fetch upload file paths
      let photoPath = '';
      let idProofPath = '';

      if (req.files) {
        if (req.files.photo) {
          photoPath = `/uploads/${req.files.photo[0].filename}`;
        }
        if (req.files.idProof) {
          idProofPath = `/uploads/${req.files.idProof[0].filename}`;
        }
      }

      // 3. Create Tenant Profile
      const tenant = await Tenant.create({
        userId: user._id,
        name,
        email,
        phone,
        emergencyContact,
        photo: photoPath,
        idProof: idProofPath,
        room: room ? room : null,
        checkInDate
      });

      // 4. Update Room tenants array and recalculate occupancy status
      if (roomDoc) {
        roomDoc.tenants.push(tenant._id);
        await roomDoc.save(); // pre-save hooks will update occupancyStatus
      }

      // 5. Link Tenant profile back to the User account
      user.tenantId = tenant._id;
      await user.save();

      res.status(201).json({
        success: true,
        data: tenant,
        credentials: {
          email: user.email,
          defaultPassword
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
  }
);

// @desc    Update tenant
// @route   PUT /api/tenants/:id
// @access  Private/Admin
router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      let tenant = await Tenant.findById(req.params.id);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      const { name, email, phone, emergencyContact, room, checkInDate, checkOutDate } = req.body;

      // Track old room to update occupancy if room changes
      const oldRoomId = tenant.room ? tenant.room.toString() : null;
      const newRoomId = room ? room.toString() : null;

      if (newRoomId && oldRoomId !== newRoomId) {
        const newRoomDoc = await Room.findById(newRoomId);
        if (!newRoomDoc) {
          return res.status(404).json({ success: false, message: 'New Room not found' });
        }
        if (newRoomDoc.tenants.length >= newRoomDoc.bedCapacity) {
          return res.status(400).json({ success: false, message: 'New room is fully occupied' });
        }
      }

      // Update file paths if new files uploaded
      if (req.files) {
        if (req.files.photo) {
          // delete old photo if exists
          if (tenant.photo) {
            const oldPhotoPath = path.join(__dirname, '..', tenant.photo);
            if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
          }
          tenant.photo = `/uploads/${req.files.photo[0].filename}`;
        }
        if (req.files.idProof) {
          // delete old id proof if exists
          if (tenant.idProof) {
            const oldIdPath = path.join(__dirname, '..', tenant.idProof);
            if (fs.existsSync(oldIdPath)) fs.unlinkSync(oldIdPath);
          }
          tenant.idProof = `/uploads/${req.files.idProof[0].filename}`;
        }
      }

      // Update text fields
      tenant.name = name || tenant.name;
      tenant.email = email || tenant.email;
      tenant.phone = phone || tenant.phone;
      tenant.emergencyContact = emergencyContact || tenant.emergencyContact;
      tenant.checkInDate = checkInDate || tenant.checkInDate;
      tenant.checkOutDate = checkOutDate || tenant.checkOutDate;

      // Handle room change logic
      if (oldRoomId !== newRoomId) {
        // Remove from old room
        if (oldRoomId) {
          const oldRoom = await Room.findById(oldRoomId);
          if (oldRoom) {
            oldRoom.tenants = oldRoom.tenants.filter(tid => tid.toString() !== tenant._id.toString());
            await oldRoom.save();
          }
        }
        // Add to new room
        if (newRoomId) {
          const newRoom = await Room.findById(newRoomId);
          if (newRoom) {
            newRoom.tenants.push(tenant._id);
            await newRoom.save();
          }
          tenant.room = newRoomId;
        } else {
          tenant.room = null;
        }
      }

      await tenant.save();

      // Sync user profile name and email
      const user = await User.findById(tenant.userId);
      if (user) {
        user.name = tenant.name;
        user.email = tenant.email;
        await user.save();
      }

      res.json({ success: true, data: tenant });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
  }
);

// @desc    Checkout tenant
// @route   POST /api/tenants/:id/checkout
// @access  Private/Admin
router.post('/:id/checkout', protect, authorize('admin'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (tenant.status === 'checked_out') {
      return res.status(400).json({ success: false, message: 'Tenant is already checked out' });
    }

    // Remove from room
    if (tenant.room) {
      const room = await Room.findById(tenant.room);
      if (room) {
        room.tenants = room.tenants.filter(tid => tid.toString() !== tenant._id.toString());
        await room.save();
      }
      tenant.room = null;
    }

    tenant.status = 'checked_out';
    tenant.checkOutDate = Date.now();
    await tenant.save();

    // Delete or deactivate User login
    await User.findByIdAndDelete(tenant.userId);

    res.json({ success: true, message: 'Tenant checked out successfully and credentials revoked.', data: tenant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete tenant
// @route   DELETE /api/tenants/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Remove files
    if (tenant.photo) {
      const photoPath = path.join(__dirname, '..', tenant.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
    if (tenant.idProof) {
      const idPath = path.join(__dirname, '..', tenant.idProof);
      if (fs.existsSync(idPath)) fs.unlinkSync(idPath);
    }

    // Remove from room
    if (tenant.room) {
      const room = await Room.findById(tenant.room);
      if (room) {
        room.tenants = room.tenants.filter(tid => tid.toString() !== tenant._id.toString());
        await room.save();
      }
    }

    // Delete user account
    await User.findByIdAndDelete(tenant.userId);

    // Delete tenant
    await Tenant.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
