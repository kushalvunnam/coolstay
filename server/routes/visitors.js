const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Tenant = require('../models/Tenant');
const { protect } = require('../middleware/auth');

// @desc    Get all visitor logs
// @route   GET /api/visitors
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'tenant') {
      if (!req.user.tenantId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.tenant = req.user.tenantId;
    }

    const visitors = await Visitor.find(query)
      .populate({
        path: 'tenant',
        select: 'name room',
        populate: {
          path: 'room',
          select: 'roomNumber'
        }
      })
      .sort({ entryTime: -1 });

    res.json({ success: true, count: visitors.length, data: visitors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Register a visitor
// @route   POST /api/visitors
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, relationship, contact, tenantId, entryTime, purpose } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Please provide visitor name' });
  }

  try {
    let targetTenantId = null;

    if (req.user.role === 'tenant') {
      if (!req.user.tenantId) {
        return res.status(400).json({ success: false, message: 'Resident profile not found' });
      }
      targetTenantId = req.user.tenantId;
    } else {
      // Admin registering: host tenant is optional
      if (tenantId) {
        targetTenantId = tenantId;
        const tenantExists = await Tenant.findById(targetTenantId);
        if (!tenantExists) {
          return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
      }
    }

    const visitor = await Visitor.create({
      tenant: targetTenantId,
      name,
      relationship: relationship || '',
      contact: contact || '',
      purpose: purpose || (targetTenantId ? 'Personal Visit' : 'General/Delivery'),
      entryTime: entryTime || Date.now()
    });

    res.status(201).json({ success: true, data: visitor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Log visitor exit time
// @route   PUT /api/visitors/:id/exit
// @access  Private
router.put('/:id/exit', protect, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor record not found' });
    }

    // Tenant can only checkout visitors hosted by themselves
    if (req.user.role === 'tenant' && (!visitor.tenant || req.user.tenantId.toString() !== visitor.tenant.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (visitor.exitTime) {
      return res.status(400).json({ success: false, message: 'Visitor has already exited' });
    }

    visitor.exitTime = Date.now();
    await visitor.save();

    res.json({ success: true, data: visitor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
