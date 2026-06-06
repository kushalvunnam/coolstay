const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const PaymentSetting = require('../models/PaymentSetting');
const { protect, authorize } = require('../middleware/auth');
const { sendWhatsAppRentReminder } = require('../services/whatsapp');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Filter by tenant role
    if (req.user.role === 'tenant') {
      if (!req.user.tenantId) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.tenant = req.user.tenantId;
    } else {
      // Admin filters
      const { tenantId, billingMonth, status } = req.query;
      if (tenantId) query.tenant = tenantId;
      if (billingMonth) query.billingMonth = billingMonth;
      if (status) query.status = status;
    }

    const payments = await Payment.find(query)
      .populate({
        path: 'tenant',
        select: 'name email phone status room',
        populate: {
          path: 'room',
          select: 'roomNumber'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get payments for a specific tenant
// @route   GET /api/payments/tenant/:tenantId
// @access  Private
router.get('/tenant/:tenantId', protect, async (req, res) => {
  try {
    const tenantId = req.params.tenantId;

    // Tenant can only see their own bills
    if (req.user.role === 'tenant' && req.user.tenantId.toString() !== tenantId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const payments = await Payment.find({ tenant: tenantId })
      .populate({
        path: 'tenant',
        select: 'name room',
        populate: { path: 'room', select: 'roomNumber' }
      })
      .sort({ billingMonth: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create manual payment invoice
// @route   POST /api/payments
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { tenantId, billingMonth, amountDue, dueDate } = req.body;

  if (!tenantId || !billingMonth || !amountDue || !dueDate) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant || tenant.status === 'checked_out') {
      return res.status(404).json({ success: false, message: 'Active Tenant not found' });
    }

    // Check if duplicate billing month
    const existingPayment = await Payment.findOne({ tenant: tenantId, billingMonth });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `Invoice for ${billingMonth} already exists for this tenant`
      });
    }

    const payment = await Payment.create({
      tenant: tenantId,
      billingMonth,
      amountDue,
      dueDate,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Auto-generate payments for all active tenants with rooms
// @route   POST /api/payments/auto-generate
// @access  Private/Admin
router.post('/auto-generate', protect, authorize('admin'), async (req, res) => {
  try {
    const tenants = await Tenant.find({ status: 'active', room: { $ne: null } }).populate('room');
    
    // Get current month YYYY-MM
    const today = new Date();
    const billingMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // Due date is 10th of this month
    const dueDate = new Date(today.getFullYear(), today.getMonth(), 10);

    let createdCount = 0;
    let skippedCount = 0;

    for (const tenant of tenants) {
      // Check if invoice already exists
      const exists = await Payment.findOne({ tenant: tenant._id, billingMonth });
      
      if (!exists) {
        await Payment.create({
          tenant: tenant._id,
          billingMonth,
          amountDue: tenant.room.rentPerBed,
          dueDate,
          status: 'pending'
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    res.json({
      success: true,
      message: `Invoices generated for ${billingMonth}`,
      created: createdCount,
      skipped: skippedCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// @desc    Record/Update payment status (Pay Rent)
// @route   PUT /api/payments/:id/pay
// @access  Private
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('tenant');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Secure checking: Tenant can only pay their own bills
    if (req.user.role === 'tenant' && req.user.tenantId.toString() !== payment.tenant._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to perform this payment' });
    }

    const { amountPaid, paymentMethod } = req.body;

    if (amountPaid === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide amountPaid' });
    }

    const paymentDate = new Date();
    payment.paymentDate = paymentDate;
    payment.paymentMethod = paymentMethod || payment.paymentMethod;

    // Late fee calculation
    // Overdue if paymentDate is after dueDate + 1 day buffer
    const dueTime = new Date(payment.dueDate).getTime();
    const payTime = paymentDate.getTime();
    
    let lateFee = 0;
    if (payTime > dueTime) {
      const diffTime = Math.abs(payTime - dueTime);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate Rs. 50 per day late fee
      lateFee = diffDays * 50;
    }

    payment.lateFee = lateFee;
    payment.amountPaid = Number(amountPaid);

    // If amount paid covers base due + late fee
    const totalRequired = payment.amountDue + lateFee;
    if (Number(amountPaid) >= totalRequired) {
      payment.status = 'paid';
    } else {
      payment.status = 'pending';
    }

    await payment.save();

    res.json({
      success: true,
      message: payment.status === 'paid' ? 'Payment recorded in full' : 'Partial payment recorded',
      data: payment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Send WhatsApp Payment Reminder
// @route   POST /api/payments/:id/whatsapp-reminder
// @access  Private/Admin
router.post('/:id/whatsapp-reminder', protect, authorize('admin'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('tenant');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (!payment.tenant) {
      return res.status(400).json({ success: false, message: 'Associated tenant profile not found' });
    }

    const { name, phone } = payment.tenant;

    const result = await sendWhatsAppRentReminder({
      name,
      phone,
      billingMonth: payment.billingMonth,
      amountDue: payment.amountDue,
      dueDate: payment.dueDate
    });

    res.json({
      success: true,
      message: 'WhatsApp reminder processed',
      method: result.method,
      whatsappUrl: result.whatsappUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// @desc    Send bulk WhatsApp rent reminders for unpaid bills
// @route   POST /api/payments/bulk-reminders
// @access  Private/Admin
router.post('/bulk-reminders', protect, authorize('admin'), async (req, res) => {
  try {
    const unpaidPayments = await Payment.find({ status: { $ne: 'paid' } }).populate('tenant');
    
    let sentCount = 0;
    let fallbackUrls = [];

    for (const p of unpaidPayments) {
      if (p.tenant && p.tenant.status === 'active') {
        const result = await sendWhatsAppRentReminder({
          name: p.tenant.name,
          phone: p.tenant.phone,
          billingMonth: p.billingMonth,
          amountDue: p.amountDue,
          dueDate: p.dueDate
        });
        
        sentCount++;
        if (result.method === 'fallback' && result.whatsappUrl) {
          fallbackUrls.push({
            name: p.tenant.name,
            url: result.whatsappUrl
          });
        }
      }
    }

    res.json({
      success: true,
      message: `WhatsApp reminders processed for ${sentCount} unpaid tenants`,
      count: sentCount,
      fallbacks: fallbackUrls
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// @desc    Get payment settings
// @route   GET /api/payments/settings
// @access  Private
router.get('/settings', protect, async (req, res) => {
  try {
    let settings = await PaymentSetting.findOne();
    if (!settings) {
      // Create default if not exists
      settings = await PaymentSetting.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update payment settings
// @route   PUT /api/payments/settings
// @access  Private/Admin
router.put('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const { upiId, bankName, accountNumber, ifscCode } = req.body;
    
    let settings = await PaymentSetting.findOne();
    if (!settings) {
      settings = new PaymentSetting();
    }
    
    settings.upiId = upiId || settings.upiId;
    settings.bankName = bankName || settings.bankName;
    settings.accountNumber = accountNumber || settings.accountNumber;
    settings.ifscCode = ifscCode || settings.ifscCode;
    
    await settings.save();
    
    res.json({ success: true, message: 'Payment settings updated successfully', data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

module.exports = router;
