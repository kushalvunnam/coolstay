const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coolstay');
    console.log('Connected to database for seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Tenant.deleteMany();
    await Room.deleteMany();
    await Payment.deleteMany();
    await Complaint.deleteMany();
    await Visitor.deleteMany();
    console.log('Cleared existing database collections.');

    // 1. Create Admin User
    const admin = await User.create({
      name: 'CoolStay Admin',
      email: process.env.ADMIN_EMAIL || 'admin@coolstay.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });
    console.log('Admin user created successfully.');

    // 2. Create Rooms
    const rooms = await Room.create([
      { roomNumber: '101', bedCapacity: 2, floor: 1, rentPerBed: 8000, tenants: [] },
      { roomNumber: '102', bedCapacity: 3, floor: 1, rentPerBed: 6000, tenants: [] },
      { roomNumber: '201', bedCapacity: 2, floor: 2, rentPerBed: 8500, tenants: [] },
      { roomNumber: '202', bedCapacity: 4, floor: 2, rentPerBed: 5500, tenants: [] }
    ]);
    console.log('Sample rooms created.');

    // 3. Create Tenant User Profiles (Users)
    const userTenants = await User.create([
      { name: 'John Doe', email: 'john@gmail.com', password: 'tenant123', role: 'tenant' },
      { name: 'Jane Smith', email: 'jane@gmail.com', password: 'tenant123', role: 'tenant' },
      { name: 'Alice Johnson', email: 'alice@gmail.com', password: 'tenant123', role: 'tenant' },
      { name: 'Bob Brown', email: 'bob@gmail.com', password: 'tenant123', role: 'tenant' }
    ]);

    // 4. Create Tenant Profiles linked to Users and Rooms
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const tenantDetails = [
      {
        userId: userTenants[0]._id,
        name: 'John Doe',
        email: 'john@gmail.com',
        phone: '9876543210',
        emergencyContact: '9876543211',
        room: rooms[0]._id, // 101
        checkInDate: twoMonthsAgo,
        status: 'active'
      },
      {
        userId: userTenants[1]._id,
        name: 'Jane Smith',
        email: 'jane@gmail.com',
        phone: '8765432109',
        emergencyContact: '8765432100',
        room: rooms[0]._id, // 101 (So Room 101 becomes fully occupied!)
        checkInDate: oneMonthAgo,
        status: 'active'
      },
      {
        userId: userTenants[2]._id,
        name: 'Alice Johnson',
        email: 'alice@gmail.com',
        phone: '7654321098',
        emergencyContact: '7654321099',
        room: rooms[1]._id, // 102
        checkInDate: fifteenDaysAgo,
        status: 'active'
      },
      {
        userId: userTenants[3]._id,
        name: 'Bob Brown',
        email: 'bob@gmail.com',
        phone: '6543210987',
        emergencyContact: '6543210980',
        room: rooms[1]._id, // 102
        checkInDate: tenDaysAgo,
        status: 'active'
      }
    ];

    const tenants = await Tenant.create(tenantDetails);

    // Link Tenant ID back to User.tenantId
    for (let i = 0; i < userTenants.length; i++) {
      userTenants[i].tenantId = tenants[i]._id;
      await userTenants[i].save();
    }

    // Add Tenants to their respective Rooms and save rooms (updates occupancyStatus)
    rooms[0].tenants.push(tenants[0]._id, tenants[1]._id);
    await rooms[0].save();

    rooms[1].tenants.push(tenants[2]._id, tenants[3]._id);
    await rooms[1].save();

    console.log('Tenants profiles created and assigned to rooms.');

    // 5. Create Payments History
    const prevMonthStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const d1 = new Date(); d1.setMonth(d1.getMonth() - 2);
    const month2Ago = prevMonthStr(d1); // e.g. April
    
    const d2 = new Date(); d2.setMonth(d2.getMonth() - 1);
    const month1Ago = prevMonthStr(d2); // e.g. May

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Payment due date (10th of respective month)
    const getDueDate = (monthStr) => {
      const parts = monthStr.split('-');
      return new Date(parts[0], parts[1] - 1, 10);
    };

    const getPaymentDate = (monthStr, day) => {
      const parts = monthStr.split('-');
      return new Date(parts[0], parts[1] - 1, day);
    };

    await Payment.create([
      // John Doe (room 101 rent: 8000)
      {
        tenant: tenants[0]._id,
        billingMonth: month2Ago,
        amountDue: 8000,
        amountPaid: 8000,
        dueDate: getDueDate(month2Ago),
        paymentDate: getPaymentDate(month2Ago, 5),
        status: 'paid',
        paymentMethod: 'upi'
      },
      {
        tenant: tenants[0]._id,
        billingMonth: month1Ago,
        amountDue: 8000,
        amountPaid: 8000,
        dueDate: getDueDate(month1Ago),
        paymentDate: getPaymentDate(month1Ago, 7),
        status: 'paid',
        paymentMethod: 'bank_transfer'
      },
      {
        tenant: tenants[0]._id,
        billingMonth: currentMonth,
        amountDue: 8000,
        amountPaid: 0,
        dueDate: getDueDate(currentMonth),
        status: 'pending'
      },

      // Jane Smith (room 101 rent: 8000)
      {
        tenant: tenants[1]._id,
        billingMonth: month1Ago,
        amountDue: 8000,
        amountPaid: 8000,
        dueDate: getDueDate(month1Ago),
        paymentDate: getPaymentDate(month1Ago, 8),
        status: 'paid',
        paymentMethod: 'upi'
      },
      {
        tenant: tenants[1]._id,
        billingMonth: currentMonth,
        amountDue: 8000,
        amountPaid: 2000, // partial payment
        dueDate: getDueDate(currentMonth),
        status: 'pending'
      },

      // Alice Johnson (room 102 rent: 6000)
      {
        tenant: tenants[2]._id,
        billingMonth: currentMonth,
        amountDue: 6000,
        amountPaid: 0,
        dueDate: getDueDate(currentMonth),
        status: 'pending'
      },

      // Bob Brown (room 102 rent: 6000)
      {
        tenant: tenants[3]._id,
        billingMonth: currentMonth,
        amountDue: 6000,
        amountPaid: 6000,
        dueDate: getDueDate(currentMonth),
        paymentDate: getPaymentDate(currentMonth, 4),
        status: 'paid',
        paymentMethod: 'cash'
      }
    ]);
    console.log('Sample payment records created.');

    // 6. Create Complaints
    const resolvedDate = new Date();
    resolvedDate.setDate(resolvedDate.getDate() - 3);

    await Complaint.create([
      {
        tenant: tenants[2]._id, // Alice
        category: 'WiFi',
        description: 'WiFi signal strength is extremely low in room 102, pages are buffering.',
        status: 'pending'
      },
      {
        tenant: tenants[0]._id, // John
        category: 'Electricity',
        description: 'Ceiling fan speed controller is broken in Room 101.',
        status: 'resolved',
        resolvedAt: resolvedDate
      },
      {
        tenant: tenants[1]._id, // Jane
        category: 'Cleaning',
        description: 'Trash can in floor 1 washroom is overflowing.',
        status: 'in_progress'
      }
    ]);
    console.log('Sample complaints created.');

    // 7. Create Visitor logs
    const visitor1Entry = new Date();
    visitor1Entry.setDate(visitor1Entry.getDate() - 2);
    visitor1Entry.setHours(15, 0, 0);

    const visitor1Exit = new Date(visitor1Entry);
    visitor1Exit.setHours(18, 30, 0);

    const visitor2Entry = new Date();
    visitor2Entry.setMinutes(visitor2Entry.getMinutes() - 45); // 45 mins ago

    await Visitor.create([
      {
        tenant: tenants[0]._id, // John
        name: 'David Doe',
        relationship: 'Brother',
        contact: '9988776655',
        entryTime: visitor1Entry,
        exitTime: visitor1Exit
      },
      {
        tenant: tenants[1]._id, // Jane
        name: 'Mary Smith',
        relationship: 'Mother',
        contact: '9988776644',
        entryTime: visitor2Entry,
        exitTime: null // currently inside PG
      }
    ]);
    console.log('Sample visitor records created.');

    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
