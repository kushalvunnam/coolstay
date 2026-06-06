const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');

const seedDB = async () => {
  try {
    // Clear existing collections
    await User.deleteMany();
    await Tenant.deleteMany();
    await Room.deleteMany();
    await Payment.deleteMany();
    await Complaint.deleteMany();
    await Visitor.deleteMany();
    console.log('[Auto-Seeder] Cleared existing database collections.');

    // 1. Create Admin User
    await User.create({
      name: 'CoolStay Admin',
      email: process.env.ADMIN_EMAIL || 'admin@coolstay.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });
    console.log('[Auto-Seeder] Admin user created.');

    // 2. Create Rooms
    const rooms = await Room.create([
      { roomNumber: '101', bedCapacity: 2, floor: 1, rentPerBed: 8000, tenants: [] },
      { roomNumber: '102', bedCapacity: 3, floor: 1, rentPerBed: 6000, tenants: [] },
      { roomNumber: '201', bedCapacity: 2, floor: 2, rentPerBed: 8500, tenants: [] },
      { roomNumber: '202', bedCapacity: 4, floor: 2, rentPerBed: 5500, tenants: [] }
    ]);
    console.log('[Auto-Seeder] Sample rooms created.');

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
        room: rooms[0]._id, // 101
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

    // Add Tenants to their respective Rooms
    rooms[0].tenants.push(tenants[0]._id, tenants[1]._id);
    await rooms[0].save();

    rooms[1].tenants.push(tenants[2]._id, tenants[3]._id);
    await rooms[1].save();

    console.log('[Auto-Seeder] Residents assigned to rooms.');

    // 5. Create Payments History
    const prevMonthStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const d1 = new Date(); d1.setMonth(d1.getMonth() - 2);
    const month2Ago = prevMonthStr(d1);
    
    const d2 = new Date(); d2.setMonth(d2.getMonth() - 1);
    const month1Ago = prevMonthStr(d2);

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

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
        amountPaid: 2000,
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
    console.log('[Auto-Seeder] Sample payment records created.');

    // 6. Create Complaints
    const resolvedDate = new Date();
    resolvedDate.setDate(resolvedDate.getDate() - 3);

    await Complaint.create([
      {
        tenant: tenants[2]._id,
        category: 'WiFi',
        description: 'WiFi signal strength is extremely low in room 102, pages are buffering.',
        status: 'pending'
      },
      {
        tenant: tenants[0]._id,
        category: 'Electricity',
        description: 'Ceiling fan speed controller is broken in Room 101.',
        status: 'resolved',
        resolvedAt: resolvedDate
      },
      {
        tenant: tenants[1]._id,
        category: 'Cleaning',
        description: 'Trash can in floor 1 washroom is overflowing.',
        status: 'in_progress'
      }
    ]);
    console.log('[Auto-Seeder] Sample complaints created.');

    // 7. Create Visitor logs
    const visitor1Entry = new Date();
    visitor1Entry.setDate(visitor1Entry.getDate() - 2);
    visitor1Entry.setHours(15, 0, 0);

    const visitor1Exit = new Date(visitor1Entry);
    visitor1Exit.setHours(18, 30, 0);

    const visitor2Entry = new Date();
    visitor2Entry.setMinutes(visitor2Entry.getMinutes() - 45);

    await Visitor.create([
      {
        tenant: tenants[0]._id,
        name: 'David Doe',
        relationship: 'Brother',
        contact: '9988776655',
        entryTime: visitor1Entry,
        exitTime: visitor1Exit
      },
      {
        tenant: tenants[1]._id,
        name: 'Mary Smith',
        relationship: 'Mother',
        contact: '9988776644',
        entryTime: visitor2Entry,
        exitTime: null
      }
    ]);
    console.log('[Auto-Seeder] Sample visitor records created.');
    console.log('[Auto-Seeder] DATABASE AUTO-SEEDING COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error('[Auto-Seeder] Seeding failed:', error);
  }
};

module.exports = seedDB;
