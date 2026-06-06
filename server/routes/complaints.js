const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Tenant = require('../models/Tenant');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get complaints list
// @route   GET /api/complaints
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'tenant') {
      if (!req.user.tenantId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.tenant = req.user.tenantId;
    } else {
      // Admin filters
      const { category, status } = req.query;
      if (category) query.category = category;
      if (status) query.status = status;
    }

    const complaints = await Complaint.find(query)
      .populate({
        path: 'tenant',
        select: 'name room',
        populate: {
          path: 'room',
          select: 'roomNumber'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Submit new complaint
// @route   POST /api/complaints
// @access  Private
router.post('/', protect, async (req, res) => {
  const { category, description, tenantId } = req.body;

  if (!category || !description) {
    return res.status(400).json({ success: false, message: 'Please provide category and description' });
  }

  try {
    let targetTenantId;

    if (req.user.role === 'tenant') {
      if (!req.user.tenantId) {
        return res.status(400).json({ success: false, message: 'Resident profile not found' });
      }
      targetTenantId = req.user.tenantId;
    } else {
      // Admin submitting on behalf of a tenant
      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Please specify tenantId' });
      }
      targetTenantId = tenantId;
    }

    const tenantExists = await Tenant.findById(targetTenantId);
    if (!tenantExists) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const complaint = await Complaint.create({
      tenant: targetTenantId,
      category,
      description,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Submit new anonymous/public complaint
// @route   POST /api/complaints/public
// @access  Public
router.post('/public', async (req, res) => {
  const { category, description, roomNumber } = req.body;

  if (!category || !description || !roomNumber) {
    return res.status(400).json({ success: false, message: 'Please provide category, description and room number' });
  }

  try {
    const complaint = await Complaint.create({
      category,
      description,
      roomNumber,
      isAnonymous: true,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  const { status } = req.body;

  if (!status || !['pending', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid status' });
  }

  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = status;
    if (status === 'resolved') {
      complaint.resolvedAt = Date.now();
    } else {
      complaint.resolvedAt = null;
    }

    await complaint.save();

    res.json({ success: true, data: complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
