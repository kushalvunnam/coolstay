const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  emergencyContact: {
    type: String,
    required: [true, 'Please add an emergency contact number']
  },
  photo: {
    type: String,
    default: ''
  },
  idProof: {
    type: String,
    default: ''
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  checkInDate: {
    type: Date,
    required: [true, 'Please add a check-in date']
  },
  checkOutDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'checked_out'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tenant', TenantSchema);
