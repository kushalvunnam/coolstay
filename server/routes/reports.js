const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get monthly revenue metrics for charts (last 6 months)
// @route   GET /api/reports/revenue
// @access  Private/Admin
router.get('/revenue', protect, authorize('admin'), async (req, res) => {
  try {
    // Aggregation: Group by billingMonth and sum amountPaid
    const revenueData = await Payment.aggregate([
      {
        $group: {
          _id: '$billingMonth',
          revenue: { $sum: '$amountPaid' },
          expected: { $sum: '$amountDue' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // Format output
    const formattedData = revenueData.map(item => ({
      month: item._id,
      collected: item.revenue,
      expected: item.expected
    }));

    res.json({ success: true, data: formattedData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get occupancy rate analytics
// @route   GET /api/reports/occupancy
// @access  Private/Admin
router.get('/occupancy', protect, authorize('admin'), async (req, res) => {
  try {
    const rooms = await Room.find();
    
    let totalBeds = 0;
    let occupiedBeds = 0;
    let vacantBeds = 0;

    let vacantRooms = 0;
    let partiallyOccupiedRooms = 0;
    let fullyOccupiedRooms = 0;

    rooms.forEach(room => {
      totalBeds += room.bedCapacity;
      const count = room.tenants.length;
      occupiedBeds += count;
      vacantBeds += (room.bedCapacity - count);

      if (room.occupancyStatus === 'vacant') vacantRooms++;
      else if (room.occupancyStatus === 'partially_occupied') partiallyOccupiedRooms++;
      else if (room.occupancyStatus === 'fully_occupied') fullyOccupiedRooms++;
    });

    res.json({
      success: true,
      data: {
        beds: {
          total: totalBeds,
          occupied: occupiedBeds,
          vacant: vacantBeds,
          occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
        },
        rooms: {
          total: rooms.length,
          vacant: vacantRooms,
          partiallyOccupied: partiallyOccupiedRooms,
          fullyOccupied: fullyOccupiedRooms
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get general tenant reports
// @route   GET /api/reports/tenants
// @access  Private/Admin
router.get('/tenants', protect, authorize('admin'), async (req, res) => {
  try {
    const activeCount = await Tenant.countDocuments({ status: 'active' });
    const checkedOutCount = await Tenant.countDocuments({ status: 'checked_out' });
    
    // Group tenants by room floor
    const floorReport = await Tenant.aggregate([
      { $match: { status: 'active', room: { $ne: null } } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomInfo'
        }
      },
      { $unwind: '$roomInfo' },
      {
        $group: {
          _id: '$roomInfo.floor',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        active: activeCount,
        checkedOut: checkedOutCount,
        byFloor: floorReport.map(item => ({ floor: `Floor ${item._id}`, count: item.count }))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
