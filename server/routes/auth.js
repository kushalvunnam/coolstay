const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// Generate JWT helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'coolstay_super_secret_key_987654321', {
    expiresIn: '30d'
  });
};

// @desc    Dynamic Anonymous Guest Login
// @route   POST /api/auth/guest-login
// @access  Public
router.post('/guest-login', async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    const Room = require('../models/Room');
    const Payment = require('../models/Payment');

    // 1. Generate a random identifier for the guest
    const randNum = Math.floor(100 + Math.random() * 900);
    const name = `Guest Resident #${randNum}`;
    const email = `guest${randNum}@coolstay.com`;
    const password = 'guestpassword';

    // 2. Find a room with vacancy
    const rooms = await Room.find();
    let assignedRoomId = null;
    let roomDoc = null;

    for (const r of rooms) {
      if (r.tenants.length < r.bedCapacity) {
        assignedRoomId = r._id;
        roomDoc = r;
        break;
      }
    }

    // 3. Create the User account
    const user = await User.create({
      name,
      email,
      password,
      role: 'tenant'
    });

    // 4. Create the Tenant Profile
    const checkInDate = new Date();
    const tenant = await Tenant.create({
      userId: user._id,
      name,
      email,
      phone: `9999999${randNum}`,
      emergencyContact: '9999999999',
      room: assignedRoomId,
      checkInDate,
      status: 'active'
    });

    // 5. Update room tenants list
    if (roomDoc) {
      roomDoc.tenants.push(tenant._id);
      await roomDoc.save();
    }

    // 6. Link back to User
    user.tenantId = tenant._id;
    await user.save();

    // 7. Auto-generate a mock rent bill for this guest for testing payments
    const billingMonth = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), 10);
    
    await Payment.create({
      tenant: tenant._id,
      billingMonth,
      amountDue: roomDoc ? roomDoc.rentPerBed : 6000,
      dueDate,
      status: 'pending'
    });

    // 8. Issue JWT Token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (err) {
    console.error('Guest login failed:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// @desc    Self-Register new Resident
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phone, emergencyContact } = req.body;

  if (!name || !email || !password || !phone || !emergencyContact) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  try {
    const Tenant = require('../models/Tenant');
    const Room = require('../models/Room');

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // 2. Create User login credentials
    const user = await User.create({
      name,
      email,
      password,
      role: 'tenant'
    });

    // 3. Find a room with vacancy to assign automatically
    const rooms = await Room.find();
    let assignedRoomId = null;
    let roomDoc = null;

    for (const r of rooms) {
      if (r.tenants.length < r.bedCapacity) {
        assignedRoomId = r._id;
        roomDoc = r;
        break;
      }
    }

    // 4. Create the Tenant Profile
    const tenant = await Tenant.create({
      userId: user._id,
      name,
      email,
      phone,
      emergencyContact,
      room: assignedRoomId,
      checkInDate: new Date(),
      status: 'active'
    });

    // 5. Update room tenants array and occupancy status
    if (roomDoc) {
      roomDoc.tenants.push(tenant._id);
      await roomDoc.save();
    }

    // 6. Link Tenant profile back to the User account
    user.tenantId = tenant._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Forgot Password (Generate and log Token)
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Output simulated email link to server console
    console.log(`\n================ SIMULATED PASSWORD RESET EMAIL ================`);
    console.log(`To: ${email}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset URL: http://localhost:5173/reset-password/${resetToken}`);
    console.log(`================================================================\n`);

    res.json({
      success: true,
      message: 'Password reset link sent (simulated in server terminal console)',
      token: resetToken // sending it for easier UI demonstration
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Reset Password using token
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Please provide token and password' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
