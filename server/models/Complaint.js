const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false,
    default: null
  },
  roomNumber: {
    type: String,
    default: ''
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['Electricity', 'Water', 'WiFi', 'Cleaning'],
    required: [true, 'Please add a category (Electricity, Water, WiFi, Cleaning)']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
