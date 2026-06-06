const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/dashboard/admin
// @access  Private/Admin
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    // 1. Room Metrics
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ occupancyStatus: { $ne: 'vacant' } });
    const vacantRooms = await Room.countDocuments({ occupancyStatus: 'vacant' });

    // 2. Tenant Metrics
    const totalTenants = await Tenant.countDocuments({ status: 'active' });

    // 3. Revenue Metrics
    const today = new Date();
    const billingMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Sum of paid amount for the current billing month
    const paidPayments = await Payment.find({ billingMonth });
    const monthlyRevenue = paidPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    // Sum of unpaid/pending dues for the current month
    const pendingRent = paidPayments
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + (p.amountDue + p.lateFee - p.amountPaid), 0);

    // Recent Activity Logs for Dashboard widgets
    const recentComplaints = await Complaint.find()
      .populate('tenant', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentVisitors = await Visitor.find()
      .populate('tenant', 'name')
      .sort({ entryTime: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalRooms,
          occupiedRooms,
          vacantRooms,
          totalTenants,
          monthlyRevenue,
          pendingRent
        },
        recentComplaints,
        recentVisitors
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get Tenant Dashboard Stats
// @route   GET /api/dashboard/tenant
// @access  Private
router.get('/tenant', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(404).json({ success: false, message: 'Tenant profile not found' });
    }

    const tenant = await Tenant.findById(tenantId).populate('room');
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant profile details not found' });
    }

    // 1. Roommates info
    let roommates = [];
    if (tenant.room) {
      const roomDetails = await Room.findById(tenant.room._id).populate({
        path: 'tenants',
        select: 'name phone email status'
      });
      roommates = roomDetails.tenants
        .filter(t => t._id.toString() !== tenant._id.toString() && t.status === 'active')
        .map(t => ({ name: t.name, phone: t.phone, email: t.email }));
    }

    // 2. Billing Status
    const today = new Date();
    const billingMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentBill = await Payment.findOne({ tenant: tenantId, billingMonth });
    
    // Total pending balance
    const unpaidBills = await Payment.find({ tenant: tenantId, status: { $ne: 'paid' } });
    const totalDues = unpaidBills.reduce((sum, p) => sum + (p.amountDue + p.lateFee - p.amountPaid), 0);

    // 3. Complaints status summary
    const recentComplaints = await Complaint.find({ tenant: tenantId })
      .sort({ createdAt: -1 })
      .limit(5);

    // 4. Visitors list
    const recentVisitors = await Visitor.find({ tenant: tenantId })
      .sort({ entryTime: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        profile: {
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
          photo: tenant.photo,
          checkInDate: tenant.checkInDate,
          status: tenant.status
        },
        room: tenant.room ? {
          roomNumber: tenant.room.roomNumber,
          floor: tenant.room.floor,
          bedCapacity: tenant.room.bedCapacity,
          rentPerBed: tenant.room.rentPerBed,
          roommates
        } : null,
        billing: {
          currentBill: currentBill ? {
            id: currentBill._id,
            billingMonth: currentBill.billingMonth,
            amountDue: currentBill.amountDue,
            amountPaid: currentBill.amountPaid,
            dueDate: currentBill.dueDate,
            lateFee: currentBill.lateFee,
            status: currentBill.status
          } : null,
          totalDues
        },
        recentComplaints,
        recentVisitors
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
