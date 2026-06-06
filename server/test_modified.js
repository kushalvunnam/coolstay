const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');
const Tenant = require('./models/Tenant');

const test = async () => {
  try {
    const dbPath = path.join(__dirname, 'data');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    const mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'coolstay',
        dbPath,
        storageEngine: 'wiredTiger'
      }
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('Connected to DB:', uri);

    // 1. Simulate Registration Flow:
    console.log('\n--- 1. Registration ---');
    await User.deleteMany({ email: 'test@gmail.com' });
    const user = await User.create({
      name: 'Test Resident',
      email: 'test@gmail.com',
      password: 'testpassword123',
      role: 'tenant'
    });
    console.log('User created. password in memory:', user.password);

    const tenant = await Tenant.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: '1234567890',
      emergencyContact: '0987654321',
      checkInDate: new Date(),
      status: 'active'
    });

    user.tenantId = tenant._id;
    await user.save();

    let userFromDB = await User.findById(user._id);
    console.log('Password hash after registration:', userFromDB.password);
    let match = await userFromDB.matchPassword('testpassword123');
    console.log('Password match after registration? (Should be true):', match);

    // 2. Simulate Admin Editing Tenant:
    console.log('\n--- 2. Admin Edit Tenant ---');
    const userToEdit = await User.findById(user._id);
    console.log('Loaded userToEdit.password:', userToEdit.password);
    
    // Simulate updating name and email only
    userToEdit.name = 'Updated Resident';
    userToEdit.email = 'updated@gmail.com';
    await userToEdit.save();
    console.log('User saved after edit.');

    let userAfterEdit = await User.findById(user._id);
    console.log('Password hash after edit:', userAfterEdit.password);
    match = await userAfterEdit.matchPassword('testpassword123');
    console.log('Password match after edit? (Should be true):', match);

    await mongoose.disconnect();
    await mongod.stop();
    process.exit(match ? 0 : 1);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
