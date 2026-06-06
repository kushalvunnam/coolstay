const mongoose = require('mongoose');

const seedDB = require('./seeder');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const connectionString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coolstay';
    let conn;

    try {
      conn = await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Production database connection failed: ${err.message}`);
      }

      console.log('Local MongoDB connection failed. Launching In-Memory MongoDB Server fallback...');
      
      const path = require('path');
      const fs = require('fs');
      const dbPath = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'coolstay',
          dbPath,
          storageEngine: 'wiredTiger'
        }
      });
      const uri = mongod.getUri();
      console.log(`In-Memory MongoDB Server running at: ${uri}`);
      
      conn = await mongoose.connect(uri);
      console.log(`MongoDB Connected (In-Memory): ${conn.connection.host}`);
    }

    // Auto-seed if database is fresh / empty
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('No Admin profile found. Initiating auto-seeding routine...');
      await seedDB();
    } else {
      console.log('Database already contains admin records. Skipping auto-seed.');
    }

  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    console.log('Ensure MongoDB is running or configure MONGO_URI in .env');
  }
};

module.exports = connectDB;
