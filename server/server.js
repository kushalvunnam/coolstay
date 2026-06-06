const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const https = require('https');
const connectDB = require('./config/db');
const getSSLOptions = require('./config/ssl');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'CoolStay PG/Hostel Management API is active.' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    let server;

    if (process.env.NODE_ENV === 'production') {
      server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in production mode`);
      });
    } else {
      const sslOptions = await getSSLOptions();
      server = https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`Server running securely via HTTPS in development mode on port ${PORT}`);
      });
    }

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.log(`Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};
// Launch server
startServer();
